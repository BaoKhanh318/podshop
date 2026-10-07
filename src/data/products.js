export const categories = [
  "Tất cả",
  "Áo thun",
  "Túi tote",
  "Ly & cốc",
  "Hoodie",
];

export const products = [
  {
    id: "slow-days-tee",
    name: "Áo thun Slow Days",
    kind: "tee",
    category: "Áo thun",
    price: 249000,
    oldPrice: 299000,
    colors: [
      { name: "Kem", hex: "#f0e9da" },
      { name: "Trắng", hex: "#ffffff" },
      { name: "Đen", hex: "#292a29" },
    ],
    design: "sun",
    tag: "Bán chạy",
    description:
      "Một chiếc áo cho những ngày chậm lại. Cotton mềm mại, phom rộng dễ mặc, in theo thiết kế riêng của bạn.",
  },
  {
    id: "bloom-club-tote",
    name: "Túi tote Bloom Club",
    kind: "tote",
    category: "Túi tote",
    price: 159000,
    colors: [
      { name: "Canvas tự nhiên", hex: "#e9deca" },
      { name: "Hồng phấn", hex: "#edc9c3" },
    ],
    design: "bloom",
    tag: "Mới",
    description:
      "Mang một chút nở hoa theo bạn mỗi ngày. Túi canvas dày dặn, quai dài thoải mái, vừa sách và đồ dùng hằng ngày.",
  },
  {
    id: "good-mood-mug",
    name: "Cốc Good Mood",
    kind: "mug",
    category: "Ly & cốc",
    price: 129000,
    colors: [
      { name: "Trắng", hex: "#f7f5ef" },
      { name: "Vàng bơ", hex: "#eedc98" },
    ],
    design: "smile",
    tag: "Bán chạy",
    description:
      "Bắt đầu buổi sáng với một nụ cười. Cốc sứ 350 ml, tay cầm chắc chắn và hình in mang dấu ấn của bạn.",
  },
  {
    id: "stay-cozy-hoodie",
    name: "Hoodie Stay Cozy",
    kind: "hoodie",
    category: "Hoodie",
    price: 459000,
    colors: [
      { name: "Xanh sage", hex: "#abb9a0" },
      { name: "Kem", hex: "#e8dfcc" },
      { name: "Xám khói", hex: "#a5a7a6" },
    ],
    design: "wave",
    tag: "",
    description:
      "Ấm áp vừa đủ cho một ngày dễ chịu. Nỉ mềm, phom thoải mái và chiếc túi trước để giữ đôi tay luôn ấm.",
  },
  {
    id: "sunny-side-tee",
    name: "Áo thun Sunny Side",
    kind: "tee",
    category: "Áo thun",
    price: 249000,
    colors: [
      { name: "Hồng đất", hex: "#d7a9a0" },
      { name: "Vàng bơ", hex: "#eedc98" },
      { name: "Trắng", hex: "#ffffff" },
    ],
    design: "smile",
    tag: "Mới",
    description:
      "Chút năng lượng vui vẻ cho tủ đồ của bạn. Áo cotton thoáng mát với hình in tươi sáng, dễ phối cùng mọi phong cách.",
  },
  {
    id: "little-waves-tote",
    name: "Túi tote Little Waves",
    kind: "tote",
    category: "Túi tote",
    price: 179000,
    colors: [
      { name: "Canvas tự nhiên", hex: "#e9deca" },
      { name: "Xanh biển", hex: "#a4bfca" },
    ],
    design: "wave",
    tag: "",
    description:
      "Dành cho tâm hồn luôn hướng về biển. Túi canvas tiện dụng với những con sóng nhỏ và chỗ cho mọi món đồ yêu thích.",
  },
  {
    id: "flower-hour-mug",
    name: "Cốc Flower Hour",
    kind: "mug",
    category: "Ly & cốc",
    price: 149000,
    colors: [
      { name: "Hồng phấn", hex: "#edc9c3" },
      { name: "Trắng", hex: "#f7f5ef" },
    ],
    design: "bloom",
    tag: "Mới",
    description:
      "Một khoảng nghỉ nhỏ, một tách trà thơm. Cốc sứ với họa tiết hoa, có thể thêm tên hoặc lời nhắn để làm món quà riêng.",
  },
  {
    id: "weekend-club-hoodie",
    name: "Hoodie Weekend Club",
    kind: "hoodie",
    category: "Hoodie",
    price: 479000,
    oldPrice: 529000,
    colors: [
      { name: "Kem", hex: "#e8dfcc" },
      { name: "Xanh navy", hex: "#454e63" },
      { name: "Hồng đất", hex: "#d7a9a0" },
    ],
    design: "sun",
    tag: "",
    description:
      "Cuối tuần bắt đầu từ một chiếc hoodie thật thoải mái. Nỉ mềm, mũ hai lớp và thiết kế riêng dành cho bạn.",
  },
];

const priceFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

export function formatPrice(value) {
  return priceFormatter.format(
    Number.isFinite(Number(value)) ? Number(value) : 0,
  );
}
