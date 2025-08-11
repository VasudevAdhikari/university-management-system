// 1. Total Enrollment
new Chart(document.getElementById("enrollmentChart"), {
    type: "bar",
    data: {
      labels: ["2020", "2021", "2022", "2023", "2024"],
      datasets: [
        {
          label: "Total Enrollment",
          data: [120, 135, 150, 145, 160],
          backgroundColor: "#003366",
          borderColor: "#00264d",
          hoverBackgroundColor: "#1a4d80",
          borderWidth: 2,
        },
      ],
    },
    options: {
      plugins: {
        legend: { labels: { color: "#003366" } },
      },
      scales: {
        x: { ticks: { color: "#003366" }, grid: { color: "#FFD700" } },
        y: { ticks: { color: "#003366" }, grid: { color: "#FFD700" } },
      },
    },
  });
  
  // 2. Degree Percentage (Pie)
  new Chart(document.getElementById("degreePieChart"), {
    type: "pie",
    data: {
      labels: ["BSc", "MSc", "PhD"],
      datasets: [
        {
          data: [60, 30, 10],
          backgroundColor: ["#003366", "#FFD700", "#1a4d80"],
          borderColor: ["#00264d", "#FFD700", "#003366"],
          borderWidth: 2,
        },
      ],
    },
    options: {
      plugins: {
        legend: { labels: { color: "#003366" } },
      },
    },
  });
  
  // 3. Course Rate
  new Chart(document.getElementById("courseRateChart"), {
    type: "bar",
    data: {
      labels: ["Math", "Physics", "Chemistry", "Biology"],
      datasets: [
        {
          label: "Students per Course",
          data: [40, 35, 30, 25],
          backgroundColor: ["#FFD700", "#003366", "#1a4d80", "#00264d"],
          borderColor: "#003366",
          borderWidth: 2,
        },
      ],
    },
    options: {
      plugins: {
        legend: { labels: { color: "#003366" } },
      },
      scales: {
        x: { ticks: { color: "#003366" }, grid: { color: "#FFD700" } },
        y: { ticks: { color: "#003366" }, grid: { color: "#FFD700" } },
      },
    },
  });
  
  // 4. Gender Ratio (Dual Axis)
  new Chart(document.getElementById("genderRatioChart"), {
    type: "bar",
    data: {
      labels: ["2020", "2021", "2022", "2023", "2024"],
      datasets: [
        {
          label: "Male",
          data: [70, 75, 80, 78, 85],
          backgroundColor: "#003366",
          borderColor: "#00264d",
          yAxisID: "y",
        },
        {
          label: "Female",
          data: [50, 60, 70, 67, 75],
          backgroundColor: "#FFD700",
          borderColor: "#FFD700",
          yAxisID: "y",
        },
        {
          label: "Female %",
          data: [41, 44, 47, 46, 47],
          type: "line",
          borderColor: "#1a4d80",
          backgroundColor: "rgba(26, 77, 128, 0.2)",
          yAxisID: "y1",
        },
      ],
    },
    options: {
      plugins: {
        legend: { labels: { color: "#003366" } },
      },
      scales: {
        y: {
          beginAtZero: true,
          position: "left",
          title: { display: true, text: "Count", color: "#003366" },
          ticks: { color: "#003366" },
          grid: { color: "#FFD700" },
        },
        y1: {
          beginAtZero: true,
          position: "right",
          title: { display: true, text: "Percentage", color: "#003366" },
          min: 0,
          max: 100,
          ticks: { color: "#003366" },
          grid: { color: "#FFD700" },
        },
      },
    },
  });
  
  // 5. Annual Average GPA
  new Chart(document.getElementById("gpaChart"), {
    type: "line",
    data: {
      labels: ["2020", "2021", "2022", "2023", "2024"],
      datasets: [
        {
          label: "Average GPA",
          data: [3.1, 3.2, 3.3, 3.25, 3.4],
          borderColor: "#003366",
          backgroundColor: "rgba(0, 51, 102, 0.15)",
          pointBackgroundColor: "#FFD700",
          pointBorderColor: "#003366",
          fill: true,
        },
      ],
    },
    options: {
      plugins: {
        legend: { labels: { color: "#003366" } },
      },
      scales: {
        x: { ticks: { color: "#003366" }, grid: { color: "#FFD700" } },
        y: { ticks: { color: "#003366" }, grid: { color: "#FFD700" } },
      },
    },
  });
  