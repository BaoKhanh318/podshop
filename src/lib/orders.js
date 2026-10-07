const DATABASE_NAME = "muc.studio.v1";
const DATABASE_VERSION = 1;
const STORE_NAME = "orders";
const MAX_ORDERS = 10;

function storageError(operation, cause) {
  const details = {
    QuotaExceededError: "Browser storage is full.",
    SecurityError: "Browser privacy settings prevent access to order storage.",
    NotAllowedError: "Browser settings prevent access to order storage.",
    DataCloneError: "The order contains data that cannot be saved.",
    AbortError: "The storage transaction was interrupted.",
  };
  const message =
    details[cause?.name] || cause?.message || "Order storage is unavailable.";
  return new Error(`Could not ${operation}: ${message}`, { cause });
}

function openDatabase() {
  return new Promise((resolve, reject) => {
    let request;
    let settled = false;
    const fail = (error) => {
      if (settled) return;
      settled = true;
      reject(storageError("open order storage", error));
    };
    try {
      if (!globalThis.indexedDB)
        throw new Error("This browser does not support IndexedDB.");
      request = globalThis.indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    } catch (error) {
      fail(error);
      return;
    }
    request.onupgradeneeded = () => {
      try {
        if (!request.result.objectStoreNames.contains(STORE_NAME)) {
          request.result.createObjectStore(STORE_NAME, { keyPath: "id" });
        }
      } catch (error) {
        request.transaction?.abort();
        fail(error);
      }
    };
    request.onerror = () => fail(request.error);
    request.onblocked = () =>
      fail(
        new Error(
          "Another tab is blocking order storage. Close that tab and try again.",
        ),
      );
    request.onsuccess = () => {
      const database = request.result;
      database.onversionchange = () => database.close();
      if (settled) database.close();
      else {
        settled = true;
        resolve(database);
      }
    };
  });
}

function newestFirst(a, b) {
  const dateA = Date.parse(a.createdAt) || 0;
  const dateB = Date.parse(b.createdAt) || 0;
  return dateB - dateA || String(b.id).localeCompare(String(a.id));
}

function transactionResult(database, mode, operation, run) {
  return new Promise((resolve, reject) => {
    let transaction;
    let result;
    let failure;
    try {
      transaction = database.transaction(STORE_NAME, mode);
      transaction.oncomplete = () => {
        database.close();
        resolve(result);
      };
      transaction.onabort = () => {
        database.close();
        reject(storageError(operation, failure || transaction.error));
      };
      transaction.onerror = (event) => {
        failure ||= event.target.error || transaction.error;
      };
      run(
        transaction.objectStore(STORE_NAME),
        (value) => {
          result = value;
        },
        (error) => {
          failure = error;
          transaction.abort();
        },
      );
    } catch (error) {
      failure = error;
      if (transaction) {
        try {
          transaction.abort();
        } catch {
          database.close();
          reject(storageError(operation, error));
        }
      } else {
        database.close();
        reject(storageError(operation, error));
      }
    }
  });
}

/** Saves artwork with the order, without duplicating it in localStorage. */
export async function saveOrder(order) {
  if (
    !order ||
    typeof order !== "object" ||
    Array.isArray(order) ||
    typeof order.id !== "string" ||
    !order.id.trim()
  ) {
    throw new Error(
      "Could not save the order: A non-empty order ID is required.",
    );
  }
  const database = await openDatabase();
  return transactionResult(
    database,
    "readwrite",
    "save the order",
    (store, setResult, abort) => {
      const put = store.put(order);
      put.onsuccess = () => {
        const recent = store.getAll();
        recent.onsuccess = () => {
          try {
            const otherOrders = recent.result
              .filter((item) => item.id !== order.id)
              .sort(newestFirst);
            for (const oldOrder of otherOrders.slice(MAX_ORDERS - 1))
              store.delete(oldOrder.id);
            setResult(order);
          } catch (error) {
            abort(error);
          }
        };
      };
    },
  );
}

/** Returns undefined when an order is absent. Storage failures reject. */
export async function getOrder(id) {
  if (typeof id !== "string" || !id.trim()) {
    throw new Error(
      "Could not read the order: A non-empty order ID is required.",
    );
  }
  const database = await openDatabase();
  return transactionResult(
    database,
    "readonly",
    "read the order",
    (store, setResult) => {
      const request = store.get(id);
      request.onsuccess = () => setResult(request.result);
    },
  );
}

export async function getRecentOrders() {
  const database = await openDatabase();
  return transactionResult(
    database,
    "readonly",
    "read recent orders",
    (store, setResult, abort) => {
      const request = store.getAll();
      request.onsuccess = () => {
        try {
          setResult(request.result.sort(newestFirst));
        } catch (error) {
          abort(error);
        }
      };
    },
  );
}
