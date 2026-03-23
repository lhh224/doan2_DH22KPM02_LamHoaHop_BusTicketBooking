/**
 * File: seat-template.service.js
 * Mục đích: Xử lý logic liên quan đến template sơ đồ ghế
 */

const fs = require("fs").promises;
const path = require("path");

/**
 * Lấy danh sách tất cả template có sẵn
 * @returns {Promise<Array>} - Danh sách template
 */
const getAllTemplates = async () => {
  try {
    const templatesDir = path.join(__dirname, "../../frontend/seat-templates");
    const files = await fs.readdir(templatesDir);
    const jsonFiles = files.filter((f) => f.endsWith(".json"));

    const templates = [];
    for (const file of jsonFiles) {
      const filePath = path.join(templatesDir, file);
      const content = await fs.readFile(filePath, "utf8");
      const template = JSON.parse(content);
      templates.push({
        id: template.templateId,
        name: template.name,
        busType: template.busType,
        totalSeats: template.totalSeats,
        description: template.description,
      });
    }

    return templates;
  } catch (error) {
    console.error("❌ Lỗi lấy danh sách template:", error);
    throw error;
  }
};

/**
 * Lấy chi tiết template theo loại xe
 * @param {string} busType - Loại xe (Limousine, Giường nằm, Ghế ngồi, v.v.)
 * @returns {Promise<object>} - Template chi tiết
 */
const getTemplateByBusType = async (busType) => {
  try {
    const templatesDir = path.join(__dirname, "../../frontend/seat-templates");
    console.log("📁 Templates directory:", templatesDir);

    // Map loại xe với file template
    const typeMapping = {
      limousine: "limousine-34.json",
      "giường nằm": "sleeper-40.json",
      "giuong nam": "sleeper-40.json",
      sleeper: "sleeper-40.json",
      "vip cabin": "vip-cabin-22.json",
      cabin: "vip-cabin-22.json",
      "ghế ngồi": "standard-45.json",
      "ghe ngoi": "standard-45.json",
      standard: "standard-45.json",
      "45 chỗ": "standard-45.json",
      "45 cho": "standard-45.json",
    };

    // Tìm file phù hợp
    const busTypeLower = (busType || "").toLowerCase();
    console.log(
      "🔍 Looking for template for bus type:",
      busType,
      "->",
      busTypeLower,
    );
    let templateFile = null;

    for (const [key, file] of Object.entries(typeMapping)) {
      if (busTypeLower.includes(key)) {
        templateFile = file;
        console.log("✅ Matched:", key, "->", file);
        break;
      }
    }

    // Mặc định dùng standard nếu không tìm thấy
    if (!templateFile) {
      console.log("⚠️ No match found, using default: standard-45.json");
      templateFile = "standard-45.json";
    }

    const filePath = path.join(templatesDir, templateFile);
    console.log("📄 Reading template file:", filePath);
    const content = await fs.readFile(filePath, "utf8");
    const template = JSON.parse(content);
    console.log("✅ Template parsed successfully:", template.name);

    return template;
  } catch (error) {
    console.error("❌ Lỗi lấy template theo loại xe:", error);
    console.error("Error details:", error.message, error.stack);
    throw error;
  }
};

/**
 * Lấy template theo ID
 * @param {string} templateId - ID template (limousine-34, standard-45, sleeper-40)
 * @returns {Promise<object>} - Template chi tiết
 */
const getTemplateById = async (templateId) => {
  try {
    const templatesDir = path.join(__dirname, "../../frontend/seat-templates");
    const filePath = path.join(templatesDir, `${templateId}.json`);
    const content = await fs.readFile(filePath, "utf8");
    const template = JSON.parse(content);

    return template;
  } catch (error) {
    console.error("❌ Lỗi lấy template theo ID:", error);
    throw error;
  }
};

/**
 * Tạo danh sách ghế từ template
 * @param {object} template - Template JSON
 * @returns {Array} - Danh sách mã ghế theo thứ tự
 */
const generateSeatsFromTemplate = (template) => {
  const seats = [];

  if (template.layout.type === "single-floor") {
    // Xử lý xe 1 tầng
    for (const section of template.layout.sections) {
      if (section.type === "grid") {
        // Grid layout (cũ)
        for (const struct of section.structure) {
          if (struct.seats) {
            seats.push(...struct.seats);
          }
        }
      } else if (section.type === "vertical-columns") {
        // Vertical columns (xe 45 chỗ)
        if (section.structure && Array.isArray(section.structure)) {
          for (const struct of section.structure) {
            if (struct.seats && Array.isArray(struct.seats)) {
              seats.push(...struct.seats);
            }
          }
        }
      } else if (section.type === "horizontal-row") {
        // Horizontal row (hàng cuối xe 45 chỗ hoặc xe Limousine)
        if (section.seats && Array.isArray(section.seats)) {
          seats.push(...section.seats);
        }
      }
    }
  } else if (template.layout.type === "double-floor") {
    // Xử lý xe 2 tầng
    for (const floor of template.layout.floors) {
      for (const section of floor.sections) {
        if (section.type === "vertical-columns") {
          if (section.structure && Array.isArray(section.structure)) {
            for (const struct of section.structure) {
              if (struct.seats && Array.isArray(struct.seats)) {
                seats.push(...struct.seats);
              }
            }
          }
        } else if (section.type === "horizontal-row") {
          if (section.seats && Array.isArray(section.seats)) {
            seats.push(...section.seats);
          }
        }
      }
    }
  }

  // Loại bỏ ghế trống nếu có
  if (template.layout.sections?.[0]?.emptySeats) {
    const emptySeats = template.layout.sections[0].emptySeats;
    return seats.filter((s) => !emptySeats.includes(s));
  }

  return seats;
};

module.exports = {
  getAllTemplates,
  getTemplateByBusType,
  getTemplateById,
  generateSeatsFromTemplate,
};
