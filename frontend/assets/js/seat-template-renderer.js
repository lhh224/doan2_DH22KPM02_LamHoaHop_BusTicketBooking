/**
 * File: seat-template-renderer.js
 * Mục đích: Engine render sơ đồ ghế từ template JSON
 */

class SeatTemplateRenderer {
  constructor(template, seatsData) {
    this.template = template;
    this.seatsData = seatsData;
    this.container = null;

    // Tạo map để tra cứu nhanh ghế theo mã
    this.seatMap = new Map();
    seatsData.forEach((seat) => {
      this.seatMap.set(seat.SeatCode, seat);
    });
  }

  /**
   * Render sơ đồ ghế vào container
   * @param {HTMLElement} container - Container element
   */
  render(container) {
    this.container = container;
    container.innerHTML = "";

    if (this.template.layout.type === "single-floor") {
      this.renderSingleFloor();
    } else if (this.template.layout.type === "double-floor") {
      this.renderDoubleFloor();
    }
  }

  /**
   * Render xe 1 tầng
   */
  renderSingleFloor() {
    const layout = this.template.layout;
    const busWrapper = document.createElement("div");
    busWrapper.className = `bus-wrapper bus-${this.template.templateId}`;

    // Kiểm tra orientation
    if (layout.orientation === "horizontal-rows") {
      // Limousine - render theo hàng ngang
      this.renderHorizontalRowsLayout(busWrapper, layout);
      this.container.appendChild(busWrapper);
    } else {
      // Xe 45 chỗ - render theo cột dọc với floor-wrapper
      const floorWrapper = document.createElement("div");
      floorWrapper.className = "floor-wrapper";

      for (const section of layout.sections) {
        if (section.type === "grid") {
          const gridContainer = this.createGridSection(section);
          floorWrapper.appendChild(gridContainer);
        } else if (section.type === "vertical-columns") {
          const columnsContainer = this.createVerticalColumnsSection(section);
          floorWrapper.appendChild(columnsContainer);
        } else if (section.type === "horizontal-row") {
          const rowContainer = this.createHorizontalRow(section);
          floorWrapper.appendChild(rowContainer);
        }
      }

      busWrapper.appendChild(floorWrapper);
      this.container.appendChild(busWrapper);
    }
  }

  /**
   * Render layout theo hàng ngang (Limousine)
   */
  renderHorizontalRowsLayout(container, layout) {
    const mainContainer = document.createElement("div");
    mainContainer.className = "limousine-rows-container";

    const aisleAfter = layout.aisleAfterColumn || 3;

    for (const section of layout.sections) {
      if (section.type !== "horizontal-row") continue;

      const rowWrapper = document.createElement("div");
      rowWrapper.className = "limousine-row-wrapper";

      const rowDiv = document.createElement("div");
      rowDiv.className = "limousine-row";

      const emptyPositions = section.emptyPositions || [];
      let seatIndex = 0;

      // Tính tổng số vị trí (ghế + ghế trống)
      const totalPositions = section.seats.length + emptyPositions.length;

      for (let pos = 0; pos < totalPositions; pos++) {
        // Thêm lối đi sau vị trí aisleAfter
        if (pos === aisleAfter) {
          const aisle = document.createElement("div");
          aisle.className = "limousine-aisle";
          rowDiv.appendChild(aisle);
        }

        // Kiểm tra nếu vị trí này là ghế trống
        if (emptyPositions.includes(pos)) {
          const empty = document.createElement("div");
          empty.className = "seat-empty";
          rowDiv.appendChild(empty);
        } else {
          // Render ghế
          const seatCode = section.seats[seatIndex];
          const seatDiv = this.createSeatElement(seatCode);
          rowDiv.appendChild(seatDiv);
          seatIndex++;
        }
      }

      rowWrapper.appendChild(rowDiv);
      mainContainer.appendChild(rowWrapper);
    }

    container.appendChild(mainContainer);
  }

  /**
   * Render xe 2 tầng
   */
  renderDoubleFloor() {
    const floorsWrapper = document.createElement("div");
    floorsWrapper.className = `floors-wrapper floors-${this.template.templateId}`;

    for (const floor of this.template.layout.floors) {
      const floorWrapper = document.createElement("div");
      floorWrapper.className = "floor-wrapper";

      // Label tầng
      const floorLabel = document.createElement("div");
      floorLabel.className = "floor-label";
      floorLabel.innerHTML = `<span>${floor.label}</span>`;
      floorWrapper.appendChild(floorLabel);

      // Render các section của tầng
      const floorContainer = document.createElement("div");
      floorContainer.className = "floor-container";

      for (const section of floor.sections) {
        if (section.type === "vertical-columns") {
          const columnsContainer = this.createFloorColumnsSection(section);
          floorContainer.appendChild(columnsContainer);
        } else if (section.type === "horizontal-row") {
          const rowContainer = this.createHorizontalRow(section);
          floorContainer.appendChild(rowContainer);
        }
      }

      floorWrapper.appendChild(floorContainer);
      floorsWrapper.appendChild(floorWrapper);
    }

    this.container.appendChild(floorsWrapper);
  }

  /**
   * Tạo section grid (cho Limousine)
   */
  createGridSection(section) {
    const gridContainer = document.createElement("div");
    gridContainer.className = "grid-section";

    const structure = section.structure;
    const emptySeats = section.emptySeats || [];

    for (const item of structure) {
      if (item.type === "aisle") {
        // Lối đi
        const aisle = document.createElement("div");
        aisle.className = `aisle aisle-${item.width || "medium"}`;
        gridContainer.appendChild(aisle);
      } else if (item.columns) {
        // Nhóm cột
        const group = document.createElement("div");
        group.className = `seat-group seat-group-${item.position}`;

        // Tạo grid cho nhóm cột
        const colsDiv = document.createElement("div");
        colsDiv.className = "columns-grid";
        colsDiv.style.gridTemplateColumns = `repeat(${item.columns.length}, 1fr)`;

        // Thêm label cho các cột
        item.columns.forEach((col) => {
          const label = document.createElement("div");
          label.className = "column-label";
          label.textContent = col;
          colsDiv.appendChild(label);
        });

        // Thêm ghế theo hàng
        const rows = section.rows;
        for (let row = 1; row <= rows; row++) {
          item.columns.forEach((col) => {
            const seatCode = `${col}${String(row).padStart(2, "0")}`;
            if (!emptySeats.includes(seatCode)) {
              const seatDiv = this.createSeatElement(seatCode);
              colsDiv.appendChild(seatDiv);
            } else {
              const empty = document.createElement("div");
              empty.className = "seat-empty";
              colsDiv.appendChild(empty);
            }
          });
        }

        group.appendChild(colsDiv);
        gridContainer.appendChild(group);
      }
    }

    return gridContainer;
  }

  /**
   * Tạo section cột dọc (cho xe 45 chỗ)
   */
  createVerticalColumnsSection(section) {
    const columnsContainer = document.createElement("div");
    columnsContainer.className = "vertical-columns-section";

    const structure = section.structure;

    for (const item of structure) {
      if (item.type === "aisle") {
        // Lối đi
        const aisle = document.createElement("div");
        aisle.className = `aisle aisle-vertical aisle-${item.width || "medium"}`;
        columnsContainer.appendChild(aisle);
      } else if (item.columns) {
        // Nhóm cột
        const group = document.createElement("div");
        group.className = `seat-group seat-group-${item.position}`;

        item.columns.forEach((col) => {
          const columnDiv = document.createElement("div");
          columnDiv.className = "seat-column";

          // Label cột
          const label = document.createElement("div");
          label.className = "column-label";
          label.textContent = col;
          columnDiv.appendChild(label);

          // Ghế trong cột (lọc theo prefix)
          const columnSeats = item.seats.filter((s) => s.startsWith(col));
          columnSeats.forEach((seatCode) => {
            const seatDiv = this.createSeatElement(seatCode);
            columnDiv.appendChild(seatDiv);
          });

          group.appendChild(columnDiv);
        });

        columnsContainer.appendChild(group);
      }
    }

    return columnsContainer;
  }

  /**
   * Tạo section cột cho tầng (xe 2 tầng)
   * Tự động căn chỉnh các cột có số ghế khác nhau
   */
  createFloorColumnsSection(section) {
    const columnsContainer = document.createElement("div");
    columnsContainer.className = "floor-columns-section";

    // Render từng cột — KHÔNG thêm placeholder ở đầu
    // CSS dùng align-items: flex-end để căn cột ngắn hơn về phía dưới
    for (const item of section.structure) {
      const columnDiv = document.createElement("div");
      columnDiv.className = "seat-column";

      item.seats.forEach((seatCode) => {
        const seatDiv = this.createSeatElement(seatCode);
        columnDiv.appendChild(seatDiv);
      });

      columnsContainer.appendChild(columnDiv);
    }

    return columnsContainer;
  }

  /**
   * Tạo hàng ghế ngang
   */
  createHorizontalRow(section) {
    const rowContainer = document.createElement("div");
    rowContainer.className = `horizontal-row ${section.style || ""}`;

    if (section.label) {
      rowContainer.dataset.label = section.label;
    }

    section.seats.forEach((seatCode) => {
      const seatDiv = this.createSeatElement(seatCode);
      rowContainer.appendChild(seatDiv);
    });

    return rowContainer;
  }

  /**
   * Tạo element ghế
   */
  createSeatElement(seatCode) {
    const seat = this.seatMap.get(seatCode);

    const seatDiv = document.createElement("div");
    seatDiv.className = "seat";
    seatDiv.dataset.seatCode = seatCode;

    if (seat) {
      seatDiv.dataset.seatId = seat.SeatId;

      // Thêm icon ghế
      const seatIcon = this.getSeatIcon();
      seatDiv.innerHTML =
        seatIcon + `<span class="seat-code">${seatCode}</span>`;

      // Xác định trạng thái
      if (seat.IsAvailableForSegment === 0) {
        seatDiv.classList.add("occupied");
      } else {
        seatDiv.classList.add("available");
        seatDiv.onclick = () => this.onSeatClick(seat);
      }
    } else {
      // Ghế không tồn tại trong dữ liệu (có thể là ghế trống)
      seatDiv.classList.add("seat-empty");
      seatDiv.innerHTML = `<span class="seat-code">${seatCode}</span>`;
    }

    return seatDiv;
  }

  /**
   * Lấy icon SVG ghế
   */
  getSeatIcon() {
    return `<svg viewBox="0 0 64 64" class="seat-icon">
      <path class="seat-back" d="M8 6 C8 2, 12 0, 16 0 L48 0 C52 0, 56 2, 56 6 L56 30 L8 30 Z"/>
      <path class="seat-cushion" d="M4 32 C4 30, 6 28, 8 28 L56 28 C58 28, 60 30, 60 32 L60 48 C60 50, 58 52, 56 52 L8 52 C6 52, 4 50, 4 48 Z"/>
      <path class="seat-arm-left" d="M0 24 L6 24 L6 54 L0 54 C-2 54, -2 52, -2 50 L-2 28 C-2 26, -2 24, 0 24 Z"/>
      <path class="seat-arm-right" d="M58 24 L64 24 C66 24, 66 26, 66 28 L66 50 C66 52, 66 54, 64 54 L58 54 Z"/>
    </svg>`;
  }

  /**
   * Xử lý khi click ghế (sẽ được override)
   */
  onSeatClick(seat) {
    console.log("Seat clicked:", seat);
  }
}

// Export cho sử dụng trong seat-map.js
if (typeof module !== "undefined" && module.exports) {
  module.exports = SeatTemplateRenderer;
}
