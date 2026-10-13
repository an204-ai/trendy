import WARDS_BY_PROVINCE from "./vietnamLocations.json";

export { WARDS_BY_PROVINCE };

export function removeAccents(str) {
  if (!str) return "";
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();
}

// 34 tỉnh/thành phố chuẩn hóa sau sáp nhập theo Quyết định 19/2025/QĐ-TTg
export const VIETNAM_PROVINCES = [
  "TP. Hồ Chí Minh",
  "Hà Nội",
  "Đà Nẵng",
  "Hải Phòng",
  "Cần Thơ",
  "An Giang",
  "Bắc Ninh",
  "Cà Mau",
  "Cao Bằng",
  "Đắk Lắk",
  "Điện Biên",
  "Đồng Nai",
  "Đồng Tháp",
  "Gia Lai",
  "Hà Tĩnh",
  "Huế",
  "Hưng Yên",
  "Khánh Hòa",
  "Lai Châu",
  "Lạng Sơn",
  "Lào Cai",
  "Lâm Đồng",
  "Nghệ An",
  "Ninh Bình",
  "Phú Thọ",
  "Quảng Ngãi",
  "Quảng Ninh",
  "Quảng Trị",
  "Sơn La",
  "Tây Ninh",
  "Thái Nguyên",
  "Thanh Hóa",
  "Tuyên Quang",
  "Vĩnh Long",
];

export const PROVINCE_ALIASES = {
  hcm: "TP. Hồ Chí Minh",
  "tp hcm": "TP. Hồ Chí Minh",
  tphcm: "TP. Hồ Chí Minh",
  sg: "TP. Hồ Chí Minh",
  "sai gon": "TP. Hồ Chí Minh",
  "ho chi minh": "TP. Hồ Chí Minh",
  hn: "Hà Nội",
  "tp ha noi": "Hà Nội",
  "ha noi": "Hà Nội",
  dn: "Đà Nẵng",
  "tp da nang": "Đà Nẵng",
  "da nang": "Đà Nẵng",
  hp: "Hải Phòng",
  "tp hai phong": "Hải Phòng",
  "hai phong": "Hải Phòng",
  ct: "Cần Thơ",
  "tp can tho": "Cần Thơ",
  "can tho": "Cần Thơ",
  hue: "Huế",
  qn: "Quảng Ninh",
  bn: "Bắc Ninh",
  th: "Thanh Hóa",
  na: "Nghệ An",
  dl: "Đắk Lắk",
  ld: "Lâm Đồng",
  nt: "Khánh Hòa",
  ag: "An Giang",
  cm: "Cà Mau",
  dt: "Đồng Tháp",
  tn: "Tây Ninh",
};

export function filterProvinces(query, limit = 100) {
  const q = removeAccents(query);
  if (!q) {
    // Trả về đầy đủ tất cả 34 tỉnh/thành phố khi chưa nhập gì
    return VIETNAM_PROVINCES;
  }

  // Khớp chính xác alias viết tắt (hcm, hn, sg, dn...)
  if (PROVINCE_ALIASES[q]) {
    const aliasMatch = PROVINCE_ALIASES[q];
    const others = VIETNAM_PROVINCES.filter((p) => p !== aliasMatch);
    return [aliasMatch, ...others].slice(0, limit);
  }

  // Nếu query trùng khớp hoàn toàn với một tỉnh đã chọn, hiển thị tỉnh đó ở đầu kèm toàn bộ các tỉnh khác
  const exactProvince = VIETNAM_PROVINCES.find((p) => removeAccents(p) === q);
  if (exactProvince) {
    const others = VIETNAM_PROVINCES.filter((p) => p !== exactProvince);
    return [exactProvince, ...others].slice(0, limit);
  }

  const matched = VIETNAM_PROVINCES.filter((p) => {
    const np = removeAccents(p);
    return np.includes(q);
  });

  return matched.slice(0, limit);
}

// Flat list cho tìm kiếm toàn quốc khi cần
let cachedFlatWards = null;

function getFlatWards() {
  if (!cachedFlatWards) {
    cachedFlatWards = [];
    for (const prov of VIETNAM_PROVINCES) {
      const wards = WARDS_BY_PROVINCE[prov] || WARDS_BY_PROVINCE[prov.replace(/^TP\.\s*/, "")] || [];
      for (let i = 0; i < wards.length; i++) {
        cachedFlatWards.push({
          ward: wards[i],
          province: prov,
          norm: removeAccents(wards[i]),
        });
      }
    }
  }
  return cachedFlatWards;
}

export function filterWards(query, provinceName, limit = 200) {
  const q = removeAccents(query);

  let targetProv = provinceName;
  if (provinceName) {
    if (!WARDS_BY_PROVINCE[provinceName]) {
      const cleanName = provinceName.replace(/^TP\.\s*/, "").trim();
      if (WARDS_BY_PROVINCE[cleanName]) {
        targetProv = cleanName;
      } else {
        const found = VIETNAM_PROVINCES.find((p) => removeAccents(p) === removeAccents(provinceName));
        if (found) targetProv = found;
      }
    }
  }

  const provWards = targetProv && (WARDS_BY_PROVINCE[targetProv] || WARDS_BY_PROVINCE[targetProv.replace(/^TP\.\s*/, "")]);

  if (provWards && provWards.length > 0) {
    if (!q) {
      // Khi đã chọn tỉnh và chưa nhập từ khóa tìm kiếm phường/xã: gợi ý đầy đủ danh sách phường/xã thuộc tỉnh đó!
      return provWards.map((w) => ({ ward: w, province: targetProv }));
    }

    // Nếu query trùng khớp hoàn toàn với một phường/xã đã chọn, đưa phường/xã đó lên đầu kèm danh sách còn lại của tỉnh
    const exactWard = provWards.find((w) => removeAccents(w) === q);
    if (exactWard) {
      const others = provWards.filter((w) => w !== exactWard);
      return [exactWard, ...others].map((w) => ({ ward: w, province: targetProv }));
    }

    const matched = [];
    for (let i = 0; i < provWards.length; i++) {
      if (removeAccents(provWards[i]).includes(q)) {
        matched.push({ ward: provWards[i], province: targetProv });
        if (matched.length >= limit) break;
      }
    }
    return matched;
  }

  // Nếu chưa chọn tỉnh thành: chỉ tìm khi người dùng đã gõ từ khóa
  if (!q) return [];

  const flat = getFlatWards();
  const results = [];
  for (let i = 0; i < flat.length; i++) {
    if (flat[i].norm.includes(q)) {
      results.push({ ward: flat[i].ward, province: flat[i].province });
      if (results.length >= limit) break;
    }
  }
  return results;
}
