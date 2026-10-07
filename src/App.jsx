import { useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  ChevronRight,
  Heart,
  ImagePlus,
  Leaf,
  Menu,
  Minus,
  PackageCheck,
  Palette,
  Plus,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Truck,
  Upload,
  X,
} from "lucide-react";
import ProductArt from "./components/ProductArt.jsx";
import { products, categories, formatPrice } from "./data/products.js";
import {
  readCart,
  writeCart,
  addCartItem,
  updateCartQuantity,
  cartTotals,
} from "./lib/cart.js";
import { saveOrder, getOrder } from "./lib/orders.js";

const cn = (...classes) => classes.filter(Boolean).join(" ");
const designOptions = [
  { id: "sun", name: "Slow Days", symbol: "☀", color: "#ecc07d" },
  { id: "bloom", name: "Bloom Club", symbol: "✿", color: "#dbb4ca" },
  { id: "wave", name: "Ocean Soul", symbol: "≈", color: "#a9c8d0" },
  { id: "smile", name: "Good Mood", symbol: "☺", color: "#d4eb81" },
];

function readSavedLikes() {
  try {
    const saved = JSON.parse(localStorage.getItem("muc.likes.v1") || "[]");
    return Array.isArray(saved)
      ? saved.filter((id) => products.some((p) => p.id === id))
      : [];
  } catch {
    return [];
  }
}

function Overlay({ children, onClose, className = "", label }) {
  const panel = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const previous = document.activeElement;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel.current?.focus();
    const handleKey = (event) => {
      if (event.key === "Escape") closeRef.current();
      if (event.key === "Tab") {
        const items = panel.current?.querySelectorAll(
          'button:not(:disabled), a[href], input, select, textarea, [tabindex="0"]',
        );
        if (!items?.length) return;
        const first = items[0],
          last = items[items.length - 1];
        if (
          event.shiftKey &&
          (document.activeElement === first ||
            document.activeElement === panel.current)
        ) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = oldOverflow;
      document.removeEventListener("keydown", handleKey);
      previous?.focus();
    };
  }, []);
  return (
    <div
      className={cn("overlay", className)}
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <section
        className="overlay-panel"
        ref={panel}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={label}
      >
        {children}
      </section>
    </div>
  );
}

function RatingStars({ small = false }) {
  return (
    <span className={cn("stars", small && "small")} aria-label="5 trên 5 sao">
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} fill="currentColor" strokeWidth={1.5} />
      ))}
    </span>
  );
}

function ProductCard({ product, liked, onLike, onOpen, index }) {
  return (
    <article className="product-card">
      <div className={cn("product-image", `product-bg-${index % 4}`)}>
        {product.tag && (
          <span className={cn("product-tag", product.tag === "Mới" && "new")}>
            {product.tag}
          </span>
        )}
        <button
          className={cn("favorite-button", liked && "is-liked")}
          onClick={() => onLike(product.id)}
          aria-label={
            liked ? `Bỏ yêu thích ${product.name}` : `Yêu thích ${product.name}`
          }
          aria-pressed={liked}
        >
          <Heart size={18} fill={liked ? "currentColor" : "none"} />
        </button>
        <button
          className="art-button"
          onClick={() => onOpen(product)}
          aria-label={`Xem và tùy chỉnh ${product.name}`}
        >
          <ProductArt
            kind={product.kind}
            color={product.colors[0].hex}
            design={product.design}
          />
        </button>
        <button className="quick-custom" onClick={() => onOpen(product)}>
          Tùy chỉnh sản phẩm <Plus size={16} />
        </button>
      </div>
      <div className="product-meta">
        <span className="product-category">{product.category}</span>
        <div className="product-swatches">
          {product.colors.slice(0, 4).map((color) => (
            <span
              key={color.hex}
              style={{ background: color.hex }}
              title={color.name}
            />
          ))}
        </div>
      </div>
      <button className="product-name" onClick={() => onOpen(product)}>
        {product.name}
      </button>
      <div className="product-price">
        {formatPrice(product.price)}
        {product.oldPrice && <span>{formatPrice(product.oldPrice)}</span>}
      </div>
    </article>
  );
}

function ProductModal({ product: initialProduct, customMode, onClose, onAdd }) {
  const [product, setProduct] = useState(initialProduct);
  const [color, setColor] = useState(initialProduct.colors[0]);
  const [size, setSize] = useState(
    ["tee", "hoodie"].includes(initialProduct.kind) ? "M" : "Tiêu chuẩn",
  );
  const [design, setDesign] = useState(initialProduct.design);
  const [customText, setCustomText] = useState("");
  const [uploadedImage, setUploadedImage] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState("");
  const [added, setAdded] = useState(false);
  const [designTab, setDesignTab] = useState("presets");
  const [uploadName, setUploadName] = useState("");
  const fileInput = useRef(null);
  const switchProduct = (id) => {
    const next = products.find((p) => p.id === id);
    setProduct(next);
    setColor(next.colors[0]);
    setSize(["tee", "hoodie"].includes(next.kind) ? "M" : "Tiêu chuẩn");
    setAdded(false);
  };
  const handleUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setError("");
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setError("Vui lòng chọn ảnh PNG, JPG hoặc WEBP.");
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setError("Ảnh cần nhỏ hơn 3 MB. Hãy chọn một ảnh nhẹ hơn nhé.");
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => setError("Không đọc được ảnh. Vui lòng thử lại.");
    reader.onload = () => {
      const preview = new Image();
      preview.onload = () => {
        setUploadedImage(reader.result);
        setUploadName(file.name);
        setAdded(false);
      };
      preview.onerror = () =>
        setError(
          "Ảnh bị lỗi hoặc không đúng định dạng. Vui lòng chọn ảnh khác.",
        );
      preview.src = reader.result;
    };
    reader.readAsDataURL(file);
  };
  const handleAdd = () => {
    if (designTab === "upload" && !uploadedImage) {
      setError("Hãy tải lên một hình ảnh trước khi thêm vào giỏ.");
      return;
    }
    if (designTab === "text" && !customText.trim()) {
      setError("Hãy nhập dòng chữ bạn muốn in.");
      return;
    }
    const ok = onAdd({
      productId: product.id,
      name: product.name,
      price: product.price,
      kind: product.kind,
      color,
      size,
      design:
        designTab === "text"
          ? "text"
          : designTab === "upload"
            ? "upload"
            : design,
      customText: designTab === "text" ? customText.trim() : "",
      uploadedImage: designTab === "upload" ? uploadedImage : "",
      quantity,
    });
    if (ok !== false) {
      setAdded(true);
      setError("");
    }
  };
  const previewDesign = designTab === "text" ? "text" : design;
  return (
    <Overlay
      onClose={onClose}
      className="product-overlay"
      label={customMode ? "Thiết kế sản phẩm của bạn" : product.name}
    >
      <button
        className="modal-close icon-button"
        onClick={onClose}
        aria-label="Đóng tùy chỉnh"
      >
        <X size={22} />
      </button>
      <div className="custom-preview">
        <span className="preview-label">
          <span className="live-dot" /> XEM TRƯỚC THIẾT KẾ
        </span>
        <ProductArt
          kind={product.kind}
          color={color.hex}
          design={previewDesign}
          text={designTab === "text" ? customText : ""}
          image={designTab === "upload" ? uploadedImage : ""}
        />
        <span className="preview-note">
          <Palette size={15} /> Một chút bạn, trên mọi thứ.
        </span>
      </div>
      <div className="custom-controls">
        <p className="eyebrow">LÀM RIÊNG CHO BẠN</p>
        <h2>
          {customMode ? "Ý tưởng của bạn.\nMón đồ của bạn." : product.name}
        </h2>
        <div className="modal-price">
          {formatPrice(product.price)} <span>Đã bao gồm in thiết kế</span>
        </div>
        <p className="product-description">{product.description}</p>
        {customMode && (
          <label className="field-label">
            Chọn sản phẩm
            <select
              value={product.id}
              onChange={(e) => switchProduct(e.target.value)}
            >
              {products
                .filter(
                  (p, i, a) => a.findIndex((q) => q.kind === p.kind) === i,
                )
                .map((p) => (
                  <option value={p.id} key={p.id}>
                    {p.name}
                  </option>
                ))}
            </select>
          </label>
        )}
        <div className="option-group">
          <div className="option-heading">
            Màu sắc <span>{color.name}</span>
          </div>
          <div className="color-options">
            {product.colors.map((c) => (
              <button
                key={c.hex}
                className={cn(
                  "color-option",
                  color.hex === c.hex && "selected",
                )}
                style={{ "--swatch": c.hex }}
                onClick={() => {
                  setColor(c);
                  setAdded(false);
                }}
                aria-label={`Màu ${c.name}`}
                aria-pressed={color.hex === c.hex}
              >
                {color.hex === c.hex && <Check size={16} />}
              </button>
            ))}
          </div>
        </div>
        <div className="option-group">
          <div className="option-heading">
            {["tee", "hoodie"].includes(product.kind) ? "Kích cỡ" : "Quy cách"}{" "}
            <span>
              {["tee", "hoodie"].includes(product.kind)
                ? "Form unisex thoải mái"
                : product.kind === "mug"
                  ? "Cốc sứ 350 ml"
                  : "Túi canvas 35 × 40 cm"}
            </span>
          </div>
          <div className="size-options">
            {(["tee", "hoodie"].includes(product.kind)
              ? ["S", "M", "L", "XL", "2XL"]
              : ["Tiêu chuẩn"]
            ).map((s) => (
              <button
                className={cn(size === s && "selected")}
                key={s}
                onClick={() => {
                  setSize(s);
                  setAdded(false);
                }}
                aria-pressed={size === s}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        <div className="option-group">
          <div className="option-heading">
            Thiết kế của bạn <Sparkles size={15} />
          </div>
          <div
            className="design-tabs"
            role="tablist"
            aria-label="Loại thiết kế"
          >
            {[
              ["presets", "Mẫu có sẵn"],
              ["text", "Thêm chữ"],
              ["upload", "Tải hình"],
            ].map(([id, label]) => (
              <button
                role="tab"
                aria-selected={designTab === id}
                key={id}
                onClick={() => {
                  setDesignTab(id);
                  setAdded(false);
                  setError("");
                }}
                className={cn(designTab === id && "active")}
              >
                {label}
              </button>
            ))}
          </div>
          {designTab === "presets" && (
            <div className="design-options">
              {designOptions.map((d) => (
                <button
                  className={cn(design === d.id && "selected")}
                  key={d.id}
                  onClick={() => {
                    setDesign(d.id);
                    setAdded(false);
                  }}
                  aria-label={`Thiết kế ${d.name}`}
                  aria-pressed={design === d.id}
                >
                  <span style={{ background: d.color }}>{d.symbol}</span>
                  <small>{d.name}</small>
                </button>
              ))}
            </div>
          )}
          {designTab === "text" && (
            <div className="text-design">
              <label htmlFor="custom-text">Dòng chữ bạn muốn in</label>
              <input
                id="custom-text"
                value={customText}
                maxLength={40}
                placeholder="Ví dụ: Cứ là chính mình"
                onChange={(e) => {
                  setCustomText(e.target.value);
                  setAdded(false);
                  setError("");
                }}
              />
              <span>
                {customText.length}/40 ký tự · Xem trước trực tiếp bên trái
              </span>
            </div>
          )}
          {designTab === "upload" && (
            <div className="upload-design">
              <input
                ref={fileInput}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleUpload}
                aria-label="Tải hình thiết kế"
              />
              <button
                className="upload-button"
                onClick={() => fileInput.current?.click()}
              >
                <Upload size={21} />
                <strong>
                  {uploadedImage ? uploadName : "Tải lên thiết kế của bạn"}
                </strong>
                <span>PNG, JPG, WEBP · Tối đa 3 MB</span>
              </button>
              {uploadedImage && (
                <button
                  className="text-link remove-upload"
                  onClick={() => {
                    setUploadedImage("");
                    setUploadName("");
                    if (fileInput.current) fileInput.current.value = "";
                  }}
                >
                  Xóa ảnh
                </button>
              )}
            </div>
          )}
        </div>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="add-to-cart-row">
          <div className="quantity-control">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity === 1}
              aria-label="Giảm số lượng"
            >
              <Minus size={15} />
            </button>
            <span aria-live="polite">{quantity}</span>
            <button
              onClick={() => setQuantity((q) => Math.min(99, q + 1))}
              disabled={quantity === 99}
              aria-label="Tăng số lượng"
            >
              <Plus size={15} />
            </button>
          </div>
          <button
            className={cn("button button-dark", added && "added")}
            onClick={handleAdd}
          >
            {added ? (
              <>
                <Check size={18} /> Đã thêm vào giỏ
              </>
            ) : (
              <>
                <ShoppingBag size={18} /> Thêm vào giỏ hàng
              </>
            )}
          </button>
        </div>
        <p className="secure-note">
          <ShieldCheck size={15} /> In theo yêu cầu · Kiểm tra chất lượng trước
          khi giao
        </p>
      </div>
    </Overlay>
  );
}

function CartDrawer({ cart, onClose, onQuantity, onCheckout, onShop }) {
  const totals = cartTotals(cart);
  const remaining = Math.max(0, 500000 - totals.subtotal);
  return (
    <Overlay
      onClose={onClose}
      className="cart-overlay"
      label="Giỏ hàng của bạn"
    >
      <div className="drawer-heading">
        <h2>
          Giỏ hàng <span>({totals.count})</span>
        </h2>
        <button
          className="icon-button"
          onClick={onClose}
          aria-label="Đóng giỏ hàng"
        >
          <X />
        </button>
      </div>
      {!cart.length ? (
        <div className="empty-cart">
          <div className="empty-bag">
            <ShoppingBag size={42} strokeWidth={1} />
          </div>
          <h3>Một chiếc giỏ đang chờ bạn.</h3>
          <p>Thêm một chút cá tính vào ngày hôm nay nhé.</p>
          <button className="button button-dark" onClick={onShop}>
            Khám phá sản phẩm <ArrowRight size={17} />
          </button>
        </div>
      ) : (
        <>
          <div className="free-shipping-note">
            <Truck size={18} />
            <p>
              {remaining ? (
                <>
                  Thêm <strong>{formatPrice(remaining)}</strong> để được miễn
                  phí vận chuyển.
                </>
              ) : (
                <>
                  <strong>Yay!</strong> Đơn hàng của bạn được miễn phí vận
                  chuyển.
                </>
              )}
            </p>
            <div className="shipping-progress">
              <span
                style={{ width: `${Math.min(100, totals.subtotal / 5000)}%` }}
              />
            </div>
          </div>
          <div className="cart-items">
            {cart.map((item) => (
              <article className="cart-item" key={item.id}>
                <div className="cart-art">
                  <ProductArt
                    kind={item.kind}
                    color={item.color}
                    design={item.design}
                    text={item.customText}
                    image={item.uploadedImage}
                  />
                </div>
                <div className="cart-item-info">
                  <h3>{item.name}</h3>
                  <p>
                    {item.colorName || "Màu đã chọn"} · {item.size}
                  </p>
                  {item.customText && (
                    <p className="cart-custom-text">“{item.customText}”</p>
                  )}
                  {item.uploadedImage && (
                    <p className="cart-custom-text">Thiết kế đã tải lên</p>
                  )}
                  <strong>{formatPrice(item.price)}</strong>
                  <div className="cart-item-actions">
                    <div className="quantity-control">
                      <button
                        onClick={() => onQuantity(item.id, item.quantity - 1)}
                        aria-label={`Giảm số lượng ${item.name}`}
                      >
                        <Minus size={13} />
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        disabled={item.quantity === 99}
                        onClick={() => onQuantity(item.id, item.quantity + 1)}
                        aria-label={`Tăng số lượng ${item.name}`}
                      >
                        <Plus size={13} />
                      </button>
                    </div>
                    <button
                      className="text-link"
                      onClick={() => onQuantity(item.id, 0)}
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
          <div className="cart-summary">
            <div>
              <span>Tạm tính</span>
              <strong>{formatPrice(totals.subtotal)}</strong>
            </div>
            <div>
              <span>Vận chuyển</span>
              <span>
                {totals.shipping ? formatPrice(totals.shipping) : "Miễn phí"}
              </span>
            </div>
            <div className="cart-total">
              <strong>Tổng cộng</strong>
              <strong>{formatPrice(totals.total)}</strong>
            </div>
            <button className="button button-dark" onClick={onCheckout}>
              Tiếp tục đặt hàng <ArrowRight size={18} />
            </button>
            <p>
              <ShieldCheck size={14} /> Thiết kế của bạn được lưu cùng sản phẩm
            </p>
          </div>
        </>
      )}
    </Overlay>
  );
}

function Checkout({ cart, onClose, onFinish }) {
  const [complete, setComplete] = useState(false);
  const [customer, setCustomer] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    note: "",
  });
  const [error, setError] = useState("");
  const [orderId, setOrderId] = useState("");
  const [saving, setSaving] = useState(false);
  const totals = cartTotals(cart);
  const setField = (e) =>
    setCustomer((c) => ({ ...c, [e.target.name]: e.target.value }));
  const submit = async (event) => {
    event.preventDefault();
    if (saving) return;
    if (customer.name.trim().length < 2 || customer.address.trim().length < 8) {
      setError("Vui lòng nhập đầy đủ họ tên và địa chỉ nhận hàng.");
      return;
    }
    if (!/^(?:\+84|0)[0-9]{9}$/.test(customer.phone.replace(/[\s.-]/g, ""))) {
      setError("Vui lòng nhập số điện thoại Việt Nam hợp lệ.");
      return;
    }
    const id = `MUC-${Date.now().toString(36).toUpperCase()}`;
    const order = {
      id,
      createdAt: new Date().toISOString(),
      customer: Object.fromEntries(
        Object.entries(customer).map(([key, value]) => [key, value.trim()]),
      ),
      items: cart,
      totals,
      status: "demo",
    };
    setSaving(true);
    try {
      await saveOrder(order);
    } catch {
      setError(
        "Không lưu được đơn trên thiết bị. Vui lòng kiểm tra dung lượng trình duyệt và thử lại.",
      );
      setSaving(false);
      return;
    }
    setOrderId(id);
    setComplete(true);
    setError("");
    onFinish();
    setSaving(false);
  };
  const downloadOrder = async () => {
    try {
      const data = await getOrder(orderId);
      if (!data) throw new Error("Order missing");
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${orderId}.json`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      setError("Không đọc được đơn đã lưu. Vui lòng thử lại.");
    }
  };
  return (
    <Overlay
      onClose={onClose}
      className="checkout-overlay"
      label={complete ? "Đơn hàng mẫu đã được lưu" : "Thông tin đặt hàng"}
    >
      <button
        className="modal-close icon-button"
        onClick={onClose}
        aria-label="Đóng thông tin đặt hàng"
      >
        <X />
      </button>
      {complete ? (
        <div className="order-complete">
          <div className="success-check">
            <Check size={34} />
          </div>
          <p className="eyebrow">CẢM ƠN BẠN ĐÃ CHỌN MỰC.</p>
          <h2>Đã lưu đơn hàng mẫu!</h2>
          <p>
            Mã đơn <strong>{orderId}</strong>. Bạn có thể tải thông tin đơn để
            lưu lại.
          </p>
          <div className="demo-notice">
            Đây là bản trải nghiệm. Đơn hàng chỉ được lưu trên trình duyệt; chưa
            gửi đến cửa hàng và chưa phát sinh thanh toán.
          </div>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <button className="button button-dark" onClick={downloadOrder}>
            Tải thông tin đơn hàng <ArrowDown size={17} />
          </button>
          <button className="text-link" onClick={onClose}>
            Tiếp tục khám phá
          </button>
        </div>
      ) : (
        <form onSubmit={submit}>
          <p className="eyebrow">THÊM MỘT CHÚT BẠN VÀO CUỘC SỐNG</p>
          <h2>Thông tin đặt hàng</h2>
          <div className="demo-notice">
            Đơn hàng mẫu được lưu trên trình duyệt. Chưa hỗ trợ thanh toán hoặc
            giao hàng thực tế.
          </div>
          <div className="checkout-fields">
            <label className="field-label">
              Họ và tên
              <input
                name="name"
                required
                autoComplete="name"
                value={customer.name}
                onChange={setField}
                placeholder="Nguyễn Minh Anh"
                maxLength={80}
              />
            </label>
            <label className="field-label">
              Số điện thoại
              <input
                name="phone"
                type="tel"
                required
                autoComplete="tel"
                value={customer.phone}
                onChange={setField}
                placeholder="090 123 4567"
                maxLength={20}
              />
            </label>
            <label className="field-label full-width">
              Email
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                value={customer.email}
                onChange={setField}
                placeholder="ban@email.com"
                maxLength={120}
              />
            </label>
            <label className="field-label full-width">
              Địa chỉ nhận hàng
              <textarea
                name="address"
                required
                autoComplete="street-address"
                value={customer.address}
                onChange={setField}
                placeholder="Số nhà, đường, phường/xã, tỉnh/thành phố"
                maxLength={300}
                rows={2}
              />
            </label>
            <label className="field-label full-width">
              Lời nhắn cho MỰC. <span>(không bắt buộc)</span>
              <input
                name="note"
                value={customer.note}
                onChange={setField}
                placeholder="Một điều nhỏ bạn muốn nhắn…"
                maxLength={200}
              />
            </label>
          </div>
          <div className="checkout-total">
            <span>{totals.count} sản phẩm · Tổng cộng</span>
            <strong>{formatPrice(totals.total)}</strong>
          </div>
          {error && (
            <p role="alert" className="form-error">
              {error}
            </p>
          )}
          <button
            className="button button-dark checkout-submit"
            type="submit"
            disabled={saving}
          >
            {saving ? "Đang lưu đơn hàng…" : "Lưu đơn hàng mẫu"}{" "}
            <ArrowRight size={17} />
          </button>
        </form>
      )}
    </Overlay>
  );
}

function InfoModal({ topic, onClose }) {
  const content = {
    shipping: [
      "Giao hàng & đổi trả",
      "Mỗi sản phẩm được in riêng sau khi bạn đặt hàng. Thời gian dự kiến: 2–4 ngày sản xuất và 2–5 ngày vận chuyển.",
      "Miễn phí vận chuyển cho đơn từ 500.000đ; đơn dưới mức này có phí dự kiến 30.000đ. Nếu sản phẩm có lỗi in hoặc lỗi sản xuất, liên hệ trong 7 ngày từ khi nhận hàng để được hỗ trợ.",
      "Đây là chính sách mẫu của giao diện. Chính sách chính thức cần được chủ cửa hàng xác nhận trước khi bán hàng.",
    ],
    guide: [
      "Một ý tưởng, một món đồ riêng",
      "1. Chọn áo thun, hoodie, túi tote hoặc cốc mà bạn thích.",
      "2. Chọn màu, kích cỡ và dùng mẫu thiết kế có sẵn, thêm chữ hoặc tải hình của bạn. Bản xem trước giúp bạn hình dung thiết kế.",
      "3. Thêm vào giỏ hàng. Thiết kế được lưu cùng từng sản phẩm, kể cả khi bạn tải lại trang. Bản hiện tại hỗ trợ đặt đơn mẫu trên trình duyệt.",
    ],
    story: [
      "Chào bạn, chúng mình là MỰC.",
      "Chúng mình tin những món đồ thường ngày cũng có thể kể một câu chuyện. Một dòng chữ vui, một nét vẽ ngẫu hứng, hay một điều rất riêng của bạn.",
      "MỰC. được tạo nên để đưa những ý tưởng ấy ra ngoài màn hình — trên một chiếc áo, chiếc túi, một chiếc cốc bạn cầm mỗi sáng.",
      "Chọn điều bạn yêu. Tạo điều bạn muốn. Cứ là chính mình.",
    ],
    care: [
      "Giữ món đồ luôn như mới",
      "Áo thun, hoodie: lộn trái trước khi giặt, giặt nước dưới 30°C, không dùng chất tẩy mạnh và không ủi trực tiếp lên hình in.",
      "Túi tote: giặt nhẹ bằng tay, phơi tự nhiên ở nơi thoáng mát.",
      "Cốc sứ: ưu tiên rửa bằng tay với miếng bọt biển mềm để giữ hình in bền đẹp.",
    ],
  }[topic];
  return (
    <Overlay onClose={onClose} className="info-overlay" label={content[0]}>
      <button
        className="modal-close icon-button"
        onClick={onClose}
        aria-label="Đóng thông tin"
      >
        <X />
      </button>
      <div className="info-icon">
        <Sparkles size={29} />
      </div>
      <p className="eyebrow">MỰC. STUDIO</p>
      <h2>{content[0]}</h2>
      {content.slice(1).map((p) => (
        <p key={p}>{p}</p>
      ))}
    </Overlay>
  );
}

export default function App() {
  const [category, setCategory] = useState("Tất cả");
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [likes, setLikes] = useState(readSavedLikes);
  const [onlyLikes, setOnlyLikes] = useState(false);
  const [cart, setCart] = useState(readCart);
  const [cartOpen, setCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [customMode, setCustomMode] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [infoTopic, setInfoTopic] = useState(null);
  const [toast, setToast] = useState("");
  const [newsletter, setNewsletter] = useState("");
  const [newsletterSuccess, setNewsletterSuccess] = useState(false);
  const [newsletterError, setNewsletterError] = useState("");
  const toastTimeout = useRef(null);
  const searchRef = useRef(null);
  const totals = cartTotals(cart);
  const normalizeSearch = (value) =>
    value
      .toLocaleLowerCase("vi")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d");
  const filteredProducts = products.filter(
    (p) =>
      (category === "Tất cả" || p.category === category) &&
      (!onlyLikes || likes.includes(p.id)) &&
      (!query ||
        normalizeSearch(`${p.name} ${p.category} ${p.description}`).includes(
          normalizeSearch(query),
        )),
  );
  const showToast = (message) => {
    setToast(message);
    clearTimeout(toastTimeout.current);
    toastTimeout.current = setTimeout(() => setToast(""), 3500);
  };
  useEffect(() => () => clearTimeout(toastTimeout.current), []);
  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);
  useEffect(() => {
    if (!searchOpen) return;
    const listener = (e) => {
      if (e.key === "Escape") setSearchOpen(false);
    };
    document.addEventListener("keydown", listener);
    return () => document.removeEventListener("keydown", listener);
  }, [searchOpen]);
  const toggleLike = (id) => {
    const next = likes.includes(id)
      ? likes.filter((p) => p !== id)
      : [...likes, id];
    setLikes(next);
    try {
      localStorage.setItem("muc.likes.v1", JSON.stringify(next));
    } catch {
      showToast("Danh sách yêu thích chỉ được lưu trong phiên này.");
    }
  };
  const scrollToProducts = () => {
    document.getElementById("san-pham")?.scrollIntoView({ behavior: "smooth" });
    setMenuOpen(false);
  };
  const selectCategory = (value) => {
    setCategory(value);
    setOnlyLikes(false);
    scrollToProducts();
  };
  const openProduct = (p, isCustom = false) => {
    setSelectedProduct(p);
    setCustomMode(isCustom);
    setMenuOpen(false);
  };
  const addToCart = (item) => {
    const next = addCartItem(cart, item);
    const saved = writeCart(next);
    if (saved === false) {
      showToast("Chưa lưu được giỏ hàng. Hãy dùng ảnh thiết kế nhỏ hơn.");
      return false;
    }
    setCart(next);
    showToast("Đã thêm một chút bạn vào giỏ hàng!");
    return true;
  };
  const changeQuantity = (id, quantity) => {
    const next = updateCartQuantity(cart, id, quantity);
    if (writeCart(next) === false) {
      showToast("Không lưu được thay đổi giỏ hàng.");
      return;
    }
    setCart(next);
  };
  const startCheckout = () => {
    setCartOpen(false);
    setCheckoutOpen(true);
  };
  const finishOrder = () => {
    setCart([]);
    writeCart([]);
  };
  const subscribe = (e) => {
    e.preventDefault();
    setNewsletterError("");
    try {
      const stored = JSON.parse(
        localStorage.getItem("muc.subscribers.v1") || "[]",
      );
      const existing = Array.isArray(stored) ? stored : [];
      localStorage.setItem(
        "muc.subscribers.v1",
        JSON.stringify([
          ...new Set([...existing, newsletter.trim().toLowerCase()]),
        ]),
      );
      setNewsletterSuccess(true);
    } catch {
      setNewsletterError(
        "Không lưu được email trên trình duyệt. Vui lòng thử lại.",
      );
    }
  };
  return (
    <>
      <a className="skip-link" href="#san-pham">
        Đến sản phẩm
      </a>
      <div className="announcement">
        <span>Đồ xinh, dấu ấn riêng.</span>
        <span className="announcement-divider">✦</span>
        <span>
          Miễn phí vận chuyển cho đơn từ 500K <ArrowUpRight size={13} />
        </span>
      </div>
      <header className="header">
        <div className="container header-inner">
          <a href="#" className="logo" aria-label="MỰC. Trang chủ">
            mực<span>.</span>
            <span className="logo-spark">✳</span>
          </a>
          <nav
            className={cn("main-nav", menuOpen && "open")}
            aria-label="Điều hướng chính"
          >
            <button onClick={() => selectCategory("Tất cả")}>
              Sản phẩm <ChevronDown size={13} />
            </button>
            <button onClick={() => openProduct(products[0], true)}>
              Tự thiết kế <span className="nav-new">MỚI</span>
            </button>
            <a href="#cach-hoat-dong" onClick={() => setMenuOpen(false)}>
              Cách hoạt động
            </a>
            <button
              onClick={() => {
                setInfoTopic("story");
                setMenuOpen(false);
              }}
            >
              Về MỰC.
            </button>
          </nav>
          <div className="header-actions">
            <button
              className={cn("icon-button", searchOpen && "active")}
              onClick={() => setSearchOpen((o) => !o)}
              aria-label="Tìm kiếm sản phẩm"
              aria-expanded={searchOpen}
            >
              <Search size={21} />
            </button>
            <button
              className={cn("icon-button header-heart", onlyLikes && "active")}
              onClick={() => {
                setOnlyLikes((v) => !v);
                setQuery("");
                setCategory("Tất cả");
                scrollToProducts();
              }}
              aria-label="Xem sản phẩm yêu thích"
              aria-pressed={onlyLikes}
            >
              <Heart size={21} />
              {likes.length > 0 && <span className="likes-dot" />}
            </button>
            <button
              className="cart-header-button"
              onClick={() => setCartOpen(true)}
              aria-label={`Mở giỏ hàng, ${totals.count} sản phẩm`}
            >
              <ShoppingBag size={20} />
              <span className="cart-button-text">Giỏ hàng</span>
              <span className="cart-count">{totals.count}</span>
            </button>
            <button
              className="icon-button mobile-menu"
              onClick={() => setMenuOpen((o) => !o)}
              aria-label={menuOpen ? "Đóng menu" : "Mở menu"}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
        {searchOpen && (
          <div className="search-panel">
            <form
              className="container search-form"
              onSubmit={(e) => {
                e.preventDefault();
                scrollToProducts();
                setSearchOpen(false);
              }}
            >
              <Search size={22} />
              <input
                ref={searchRef}
                type="search"
                placeholder="Tìm áo thun, túi tote, cốc…"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setOnlyLikes(false);
                  setCategory("Tất cả");
                }}
                aria-label="Nhập tên sản phẩm"
              />
              <button type="submit" className="text-link">
                Tìm kiếm <ArrowRight size={16} />
              </button>
              <button
                className="icon-button"
                type="button"
                onClick={() => setSearchOpen(false)}
                aria-label="Đóng tìm kiếm"
              >
                <X size={19} />
              </button>
            </form>
          </div>
        )}
      </header>
      <main>
        <section className="hero container">
          <div className="hero-copy">
            <div className="hero-kicker">
              <span className="live-dot" /> PRINT YOUR PERSONALITY
            </div>
            <h1>
              Một chút{" "}
              <span className="title-you">
                bạn
                <svg viewBox="0 0 220 20" aria-hidden="true">
                  <path d="M4 14Q91-4 210 9" />
                </svg>
              </span>
              ,<br />
              trên mọi thứ<span className="hero-period">.</span>
            </h1>
            <p>
              Biến ý tưởng thành những món đồ bạn yêu.
              <br className="desktop-break" /> Tự thiết kế áo thun, túi tote,
              cốc và hơn thế nữa.
              <br className="desktop-break" /> Độc đáo như chính bạn.
            </p>
            <div className="hero-buttons">
              <button
                className="button button-dark"
                onClick={() => openProduct(products[0], true)}
              >
                Bắt đầu thiết kế <ArrowUpRight size={20} />
              </button>
              <button
                className="hero-shop-link"
                onClick={() => selectCategory("Tất cả")}
              >
                Khám phá sản phẩm <ArrowRight size={17} />
              </button>
            </div>
            <div className="hero-proof">
              <div className="avatar-stack">
                <span>☻</span>
                <span>☺</span>
                <span>☻</span>
                <span>☺</span>
              </div>
              <div>
                <RatingStars small />
                <p>Được tạo để mang dấu ấn của bạn</p>
              </div>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-grid" />
            <div className="hero-asterisk" aria-hidden="true">
              ✳
            </div>
            <span className="scene-note">YOUR IDEAS, MADE REAL.</span>
            <div className="hero-tee">
              <ProductArt kind="tee" color="#f7f3e9" design="sun" />
            </div>
            <div className="hero-tote">
              <ProductArt kind="tote" color="#e9dec8" design="bloom" />
            </div>
            <div className="hero-mug">
              <ProductArt kind="mug" color="#f9f5ed" design="smile" />
            </div>
            <div className="own-badge">
              <span>100%</span>
              <small>của bạn</small>
              <svg viewBox="0 0 80 12" aria-hidden="true">
                <path d="M3 8Q35 0 75 6" />
              </svg>
            </div>
            <div className="hero-design-label">
              <span>
                <Palette size={22} />
              </span>
              <div>
                <strong>Bạn nghĩ. MỰC. in.</strong>
                <small>Không giới hạn sự sáng tạo.</small>
              </div>
              <ArrowUpRight size={17} />
            </div>
            <svg className="hero-doodle" viewBox="0 0 90 70" aria-hidden="true">
              <path d="M7 9C70-12 58 68 20 45S67 1 80 57M66 48l14 10 2-20" />
            </svg>
          </div>
        </section>
        <div className="benefits-bar">
          <div className="container benefits-inner">
            <span>
              <Palette /> Thiết kế theo cách của bạn
            </span>
            <i>✦</i>
            <span>
              <Leaf /> In khi bạn đặt, giảm lãng phí
            </span>
            <i>✦</i>
            <span>
              <PackageCheck /> Chất lượng từ từng chi tiết
            </span>
            <i>✦</i>
            <span>
              <Truck /> Giao tận tay, khắp Việt Nam
            </span>
          </div>
        </div>
        <section className="products-section container" id="san-pham">
          <div className="section-heading">
            <div>
              <p className="eyebrow">CHỌN MỘT MÓN ĐỒ. THÊM MỘT CHÚT BẠN.</p>
              <h2>
                Bắt đầu từ những điều bạn thích
                <span className="heading-spark">✳</span>
              </h2>
            </div>
            <button
              className="section-link"
              onClick={() => {
                setQuery("");
                setCategory("Tất cả");
                setOnlyLikes(false);
              }}
            >
              Xem tất cả <ArrowUpRight size={18} />
            </button>
          </div>
          <div className="product-filter-row">
            <div className="category-filters" aria-label="Danh mục sản phẩm">
              {categories.map((c) => (
                <button
                  key={c}
                  className={cn(category === c && !onlyLikes && "active")}
                  aria-pressed={category === c && !onlyLikes}
                  onClick={() => {
                    setCategory(c);
                    setOnlyLikes(false);
                  }}
                >
                  {c}
                </button>
              ))}
              <button
                className={cn("likes-filter", onlyLikes && "active")}
                aria-pressed={onlyLikes}
                onClick={() => setOnlyLikes((o) => !o)}
              >
                <Heart size={14} /> Yêu thích
              </button>
            </div>
            <span className="product-count">
              {filteredProducts.length} sản phẩm
            </span>
          </div>
          {query && (
            <div className="search-results-label">
              Kết quả cho “{query}”
              <button className="text-link" onClick={() => setQuery("")}>
                Xóa tìm kiếm <X size={14} />
              </button>
            </div>
          )}
          {filteredProducts.length ? (
            <div className="product-grid">
              {filteredProducts.map((p, i) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  index={i}
                  liked={likes.includes(p.id)}
                  onLike={toggleLike}
                  onOpen={openProduct}
                />
              ))}
            </div>
          ) : (
            <div className="no-products">
              <Search size={32} />
              <h3>
                {onlyLikes
                  ? "Chưa có món đồ yêu thích nào."
                  : "Chưa tìm thấy món đồ này."}
              </h3>
              <p>
                {onlyLikes
                  ? "Chạm vào trái tim trên sản phẩm để lưu lại nhé."
                  : "Thử một từ khóa khác hoặc khám phá tất cả sản phẩm."}
              </p>
              <button
                className="button button-dark"
                onClick={() => {
                  setQuery("");
                  setOnlyLikes(false);
                  setCategory("Tất cả");
                }}
              >
                Khám phá tất cả <ArrowRight size={16} />
              </button>
            </div>
          )}
        </section>
        <section className="studio-banner container" id="thiet-ke">
          <div className="studio-copy">
            <p className="eyebrow">MỰC. CREATIVE STUDIO</p>
            <h2>
              Có ý tưởng hay?
              <br />
              Cho nó một chỗ
              <br />
              để <span>tỏa sáng.</span>
            </h2>
            <p>
              Một câu nói. Một nét vẽ. Một điều rất bạn.
              <br />
              Mang lên món đồ yêu thích, chỉ trong vài phút.
            </p>
            <button
              className="button button-lime"
              onClick={() => openProduct(products[0], true)}
            >
              Thử thiết kế ngay <ArrowUpRight size={19} />
            </button>
            <span className="studio-small-note">
              Không cần là designer. Chỉ cần là bạn.
            </span>
          </div>
          <div className="studio-art">
            <div className="studio-circle" />
            <div className="studio-floating-label">
              <span className="live-dot" /> MADE BY YOU
            </div>
            <div className="studio-shirt">
              <ProductArt kind="tee" color="#d6cde5" design="bloom" />
            </div>
            <div className="studio-toolbar">
              <span>
                <Palette size={20} />
              </span>
              <span>
                <ImagePlus size={20} />
              </span>
              <span className="toolbar-text">Aa</span>
              <span className="toolbar-plus">
                <Plus size={19} />
              </span>
            </div>
            <div className="studio-color-picker">
              <span style={{ background: "#eee6d7" }} />
              <span style={{ background: "#d6cde5" }} className="selected" />
              <span style={{ background: "#60735e" }} />
              <span style={{ background: "#282b27" }} />
            </div>
            <span className="studio-star">✳</span>
            <div className="studio-cursor">
              <svg viewBox="0 0 35 40" aria-hidden="true">
                <path d="M3 2L29 22 17 24 12 37Z" />
              </svg>
              <span>Ý tưởng của bạn</span>
            </div>
          </div>
        </section>
        <section className="how-section container" id="cach-hoat-dong">
          <div className="section-heading">
            <div>
              <p className="eyebrow">TỪ Ý TƯỞNG ĐẾN TỦ ĐỒ</p>
              <h2>Thật đơn giản. Thật là bạn.</h2>
            </div>
            <p className="heading-description">
              Bạn lo phần sáng tạo.
              <br />
              Phần còn lại, để MỰC.
            </p>
          </div>
          <div className="steps-grid">
            <article>
              <div className="step-top">
                <span>01</span>
                <div>
                  <ShoppingBag size={26} />
                </div>
              </div>
              <h3>Chọn món đồ bạn thích</h3>
              <p>
                Áo thun, tote hay một chiếc cốc?
                <br />
                Chọn một “trang giấy” cho ý tưởng của bạn.
              </p>
              <button
                className="text-link"
                onClick={() => selectCategory("Tất cả")}
              >
                Khám phá sản phẩm <ArrowRight size={15} />
              </button>
            </article>
            <article>
              <div className="step-top">
                <span>02</span>
                <div>
                  <Palette size={27} />
                </div>
              </div>
              <h3>Thêm dấu ấn của bạn</h3>
              <p>
                Tải hình, thêm chữ hoặc chọn mẫu có sẵn.
                <br />
                Xem trước thiết kế cho đến khi bạn ưng ý.
              </p>
              <button
                className="text-link"
                onClick={() => openProduct(products[0], true)}
              >
                Thử tự thiết kế <ArrowRight size={15} />
              </button>
            </article>
            <article>
              <div className="step-top">
                <span>03</span>
                <div>
                  <PackageCheck size={27} />
                </div>
              </div>
              <h3>MỰC. biến nó thành thật</h3>
              <p>
                In theo yêu cầu, chăm chút từng chi tiết.
                <br />
                Một món đồ của riêng bạn, giao tận tay.
              </p>
              <button
                className="text-link"
                onClick={() => setInfoTopic("shipping")}
              >
                Giao hàng & đổi trả <ArrowRight size={15} />
              </button>
            </article>
          </div>
        </section>
        <section className="brand-statement">
          <div className="container">
            <span className="statement-star">✳</span>
            <p>
              Không sản xuất hàng loạt.
              <br />
              Chỉ tạo ra những điều <span>rất riêng.</span>
            </p>
            <span className="statement-side">
              LESS WASTE.
              <br />
              MORE YOU.
            </span>
          </div>
        </section>
        <section className="newsletter-section container">
          <div>
            <p className="eyebrow">MỘT CHÚT CẢM HỨNG, GỬI ĐẾN BẠN</p>
            <h2>
              Ở lại với MỰC. nhé <span>☺</span>
            </h2>
            <p>Thiết kế mới, ý tưởng hay và những điều nho nhỏ đáng yêu.</p>
          </div>
          <form onSubmit={subscribe}>
            {newsletterSuccess ? (
              <div className="newsletter-success" role="status">
                <Check size={22} />
                <div>
                  <strong>Đã lưu email của bạn!</strong>
                  <span>Đăng ký mẫu được lưu trên trình duyệt này.</span>
                </div>
              </div>
            ) : (
              <>
                <div className="newsletter-input">
                  <input
                    type="email"
                    required
                    aria-label="Email nhận tin"
                    placeholder="Email của bạn"
                    value={newsletter}
                    onChange={(e) => setNewsletter(e.target.value)}
                    maxLength={120}
                  />
                  <button type="submit" aria-label="Đăng ký nhận tin">
                    <ArrowRight size={23} />
                  </button>
                </div>
                <p>
                  {newsletterError ||
                    "Một chiếc hộp thư vui hơn. Không spam, hứa luôn."}
                </p>
              </>
            )}
          </form>
        </section>
      </main>
      <footer className="footer">
        <div className="container footer-main">
          <div className="footer-brand">
            <a href="#" className="logo" aria-label="MỰC. Trang chủ">
              mực<span>.</span>
              <span className="logo-spark">✳</span>
            </a>
            <p>
              Một chút bạn, trên mọi thứ.
              <br />
              Made with love. Printed for you.
            </p>
            <span className="footer-made">
              Được tạo tại Việt Nam <span>♡</span>
            </span>
          </div>
          <div className="footer-links">
            <h3>Khám phá</h3>
            <button onClick={() => selectCategory("Áo thun")}>Áo thun</button>
            <button onClick={() => selectCategory("Túi tote")}>Túi tote</button>
            <button onClick={() => selectCategory("Ly & cốc")}>Ly & cốc</button>
            <button onClick={() => selectCategory("Hoodie")}>Hoodie</button>
          </div>
          <div className="footer-links">
            <h3>MỰC. giúp bạn</h3>
            <button onClick={() => setInfoTopic("guide")}>
              Hướng dẫn thiết kế
            </button>
            <button onClick={() => setInfoTopic("shipping")}>
              Giao hàng & đổi trả
            </button>
            <button onClick={() => setInfoTopic("care")}>
              Chăm sóc sản phẩm
            </button>
            <button onClick={() => setInfoTopic("story")}>
              Câu chuyện của MỰC.
            </button>
          </div>
          <div className="footer-note">
            <h3>Bạn cứ là bạn.</h3>
            <p>
              Thế giới cần thêm những điều
              <br />
              không giống ai.
            </p>
            <div className="footer-doodle">
              be yourself<span>✳</span>
            </div>
          </div>
        </div>
        <div className="container footer-bottom">
          <span>© {new Date().getFullYear()} MỰC. Studio</span>
          <span>Thiết kế riêng. In theo yêu cầu. Yêu mỗi ngày.</span>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            Lên đầu trang <ArrowUpRight size={15} />
          </button>
        </div>
      </footer>
      {selectedProduct && (
        <ProductModal
          key={`${selectedProduct.id}-${customMode}`}
          product={selectedProduct}
          customMode={customMode}
          onClose={() => setSelectedProduct(null)}
          onAdd={addToCart}
        />
      )}
      {cartOpen && (
        <CartDrawer
          cart={cart}
          onClose={() => setCartOpen(false)}
          onQuantity={changeQuantity}
          onCheckout={startCheckout}
          onShop={() => {
            setCartOpen(false);
            selectCategory("Tất cả");
          }}
        />
      )}
      {checkoutOpen && (
        <Checkout
          cart={cart}
          onClose={() => setCheckoutOpen(false)}
          onFinish={finishOrder}
        />
      )}
      {infoTopic && (
        <InfoModal topic={infoTopic} onClose={() => setInfoTopic(null)} />
      )}
      {toast && (
        <div className="toast" role="status">
          <span>
            <Check size={16} />
          </span>
          {toast}
          <button onClick={() => setToast("")} aria-label="Đóng thông báo">
            <X size={15} />
          </button>
        </div>
      )}
    </>
  );
}
