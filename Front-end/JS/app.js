const API_URL = "http://localhost:5258/api/employees";
//const API_URL = "https://www.employeems-api-mina.somee.com/api/employees";

// ================= ADD EMPLOYEE ================= (مشروط: فقط إذا كانت العناصر موجودة)
if (document.getElementById("addForm")) {
  // تحقق من وجود النموذج
  const nameInput = document.getElementById("name");
  const jobInput = document.getElementById("job");
  const deptInput = document.getElementById("dept");
  const salaryInput = document.getElementById("salary");
  const phoneInput = document.getElementById("phone");
  const msg = document.getElementById("msg");

  // ترتيب الحقول: تعطيل الحقول التالية حتى يتم ملء السابق
  if (jobInput) jobInput.disabled = true;
  if (deptInput) deptInput.disabled = true;
  if (salaryInput) salaryInput.disabled = true;
  if (phoneInput) phoneInput.disabled = true;

  // Validations على blur (مصحح: استخدام msg.innerText، وإضافة تحقق طول للهاتف)
  if (nameInput) {
    nameInput.addEventListener("blur", () => {
      if (!nameInput.value.trim()) {
        msg.innerText = "Full Name is required!";
        nameInput.value = "";
        nameInput.focus();
      } else if (!/^[a-zA-Z\s]+$/.test(nameInput.value)) {
        msg.innerText = "Full Name must contain only letters and spaces!";
        nameInput.value = "";
        nameInput.focus();
      } else {
        if (jobInput) jobInput.disabled = false; // فتح الحقل التالي
      }
    });
  }

  if (jobInput) {
    jobInput.addEventListener("blur", () => {
      if (!jobInput.value.trim()) {
        msg.innerText = "Job Title is required!";
        jobInput.value = "";
        jobInput.focus();
      } else if (!/^[a-zA-Z\s]+$/.test(jobInput.value)) {
        msg.innerText = "Job Title must contain only letters and spaces!";
        jobInput.value = "";
        jobInput.focus();
      } else {
        if (deptInput) deptInput.disabled = false;
      }
    });
  }

  if (deptInput) {
    deptInput.addEventListener("blur", () => {
      if (!deptInput.value.trim()) {
        msg.innerText = "Department is required!";
        deptInput.value = "";
        deptInput.focus();
      } else if (!/^[a-zA-Z\s]+$/.test(deptInput.value)) {
        msg.innerText = "Department must contain only letters and spaces!";
        deptInput.value = "";
        deptInput.focus();
      } else {
        if (salaryInput) salaryInput.disabled = false;
      }
    });
  }

  if (salaryInput) {
    salaryInput.addEventListener("blur", () => {
      if (!salaryInput.value.trim()) {
        msg.innerText = "Salary is required!";
        salaryInput.value = "";
        salaryInput.focus();
      } else if (!/^\d+(\.\d{1,2})?$/.test(salaryInput.value)) {
        msg.innerText = "Salary must be a valid number!";
        salaryInput.value = "";
        salaryInput.focus();
      } else {
        if (phoneInput) phoneInput.disabled = false;
      }
    });
  }

  if (phoneInput) {
    phoneInput.addEventListener("blur", () => {
      if (!phoneInput.value.trim()) {
        msg.innerText = "Phone Number is required!";
        phoneInput.value = "";
        phoneInput.focus();
      } else if (!/^\d+$/.test(phoneInput.value)) {
        msg.innerText = "Phone Number must contain only digits!";
        phoneInput.value = "";
        phoneInput.focus();
      } else if (phoneInput.value.length < 10) {
        // إضافة تحقق الطول
        msg.innerText = "Phone Number must be at least 10 digits!";
        phoneInput.value = "";
        phoneInput.focus();
      }
    });
  }

  document
    .getElementById("addForm")
    ?.addEventListener("submit", async function (e) {
      e.preventDefault();

      if (
        !nameInput.value.trim() ||
        !jobInput.value.trim() ||
        !deptInput.value.trim() ||
        !salaryInput.value.trim() ||
        !phoneInput.value.trim()
      ) {
        msg.innerText = "Please fill all fields ❗";
        return;
      }

      // مصحح: أسماء الخصائص camelCase لتطابق Backend الجديد
      let employee = {
        fullName: nameInput.value.trim(),
        jobTitle: jobInput.value.trim(),
        department: deptInput.value.trim(),
        salary: parseFloat(salaryInput.value),
        phoneNumber: phoneInput.value.trim(),
      };

      let res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(employee),
      });

      if (res.ok) {
        msg.innerText = "Employee Added Successfully ✅";
        document.getElementById("addForm").reset();
        // مصحح: إعادة تعطيل الحقول عند الإعادة تعيين
        if (jobInput) jobInput.disabled = true;
        if (deptInput) deptInput.disabled = true;
        if (salaryInput) salaryInput.disabled = true;
        if (phoneInput) phoneInput.disabled = true;
        loadEmployees();
      } else {
        let error = await res.text();
        msg.innerText = error;
      }
    });
}

// ================= VIEW EMPLOYEES ================= (مشروط: فقط إذا كان الجدول موجود)
if (document.querySelector("#employeeTable")) {
  async function loadEmployees() {
    try {
      let res = await fetch(API_URL);

      if (!res.ok) throw new Error("API Error ❌");

      let data = await res.json();

      console.log("Employees:", data); // تحقق من هذا في Console

      let tbody = document.querySelector("#employeeTable tbody");
      if (!tbody) return;

      tbody.innerHTML = "";

      if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6">No employees found 😢</td></tr>`;
        return;
      }

      data.forEach((emp) => {
        // مصحح: أسماء الخصائص camelCase، و === بدلاً من ==
        let salaryCell =
          emp.salary === 0
            ? `<td style="color: red;">${emp.salary} ⚠️ Zero Salary!</td>`
            : `<td>${emp.salary}</td>`;
        let phoneCell =
          emp.phoneNumber.length < 10
            ? `<td style="color: red;">${emp.phoneNumber} ⚠️ Short Number!</td>`
            : `<td>${emp.phoneNumber}</td>`;

        let row = `
            <tr>
              <td>${emp.id}</td>
              <td>${emp.fullName}</td>
              <td>${emp.jobTitle}</td>
              <td>${emp.department}</td>
              ${salaryCell}
              ${phoneCell}
              <td>${new Date(emp.hireDate).toLocaleDateString()}</td> 
            </tr>
          `;
        tbody.innerHTML += row;
      });
    } catch (err) {
      console.error(err);
      alert("Error loading employees ❌");
    }
  }

  loadEmployees();
}

// ================= DELETE EMPLOYEE ================= (مشروط: فقط إذا كان النموذج موجود)
if (document.getElementById("deleteForm")) {
  document
    .getElementById("deleteForm")
    ?.addEventListener("submit", async function (e) {
      e.preventDefault();

      let id = document.getElementById("delId").value;

      let res = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        document.getElementById("deleteMsg").innerText =
          "Deleted Successfully ✅";
        loadEmployees();
      } else {
        document.getElementById("deleteMsg").innerText =
          "Delete Failed ❌ (ID not found)";
      }
    });
}

// ================== تعريف loadEmployees كدالة عامة لتجنب الخطأ ===================
async function loadEmployees() {
  if (!document.querySelector("#employeeTable")) return;

  try {
    let res = await fetch(API_URL);

    if (!res.ok) throw new Error("API Error ❌");

    let data = await res.json();

    console.log("Employees:", data);

    let tbody = document.querySelector("#employeeTable tbody");
    if (!tbody) return;

    tbody.innerHTML = "";

    if (data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6">No employees found 😢</td></tr>`;
      return;
    }

    data.forEach((emp) => {
      let salaryCell =
        emp.salary === 0
          ? `<td style="color: red;">${emp.salary} ⚠️ Zero Salary!</td>`
          : `<td>${emp.salary}</td>`;
      let phoneCell =
        emp.phoneNumber.length < 10
          ? `<td style="color: red;">${emp.phoneNumber} ⚠️ Short Number!</td>`
          : `<td>${emp.phoneNumber}</td>`;

      let row = `
        <tr>
          <td>${emp.id}</td>
          <td>${emp.fullName}</td>
          <td>${emp.jobTitle}</td>
          <td>${emp.department}</td>
          ${salaryCell}
          ${phoneCell}
        </tr>
      `;
      tbody.innerHTML += row;
    });
  } catch (err) {
    console.error(err);
    alert("Error loading employees ❌");
  }
}

// ================= UPDATE EMPLOYEE ================= (مشروط: فقط إذا كان النموذج موجود)
if (document.getElementById("updateForm")) {
  document
    .getElementById("updateForm")
    ?.addEventListener("submit", async function (e) {
      e.preventDefault();

      let id = document.getElementById("id").value;
      let field = document.getElementById("field").value.toLowerCase();
      let newValue = document.getElementById("newValue").value;

      console.log("Field:", field, "New Value:", newValue);

      if (!id || !newValue) {
        document.getElementById("updateMsg").innerText =
          "Please fill all fields!";
        return;
      }

      // Validations بناءً على الحقل
      let isValid = true;
      let errorMsg = "";
      if (
        field === "fullname" ||
        field === "jobtitle" ||
        field === "department"
      ) {
        if (!/^[a-zA-Z\s]+$/.test(newValue)) {
          isValid = false;
          errorMsg = "Only text is accepted in these fields!";
        }
      } else if (field === "salary" || field === "phonenumber") {
        if (!/^\d+$/.test(newValue)) {
          isValid = false;
          errorMsg = "Only numbers are accepted in these fields!";
        }
      }

      if (!isValid) {
        document.getElementById("updateMsg").innerText = errorMsg;
        return;
      }

      try {
        let getRes = await fetch(`${API_URL}/${id}`);
        if (!getRes.ok) {
          document.getElementById("updateMsg").innerText =
            "Employee not found ❌";
          return;
        }
        let currentEmployee = await getRes.json();

        let camelCaseField = field.charAt(0).toLowerCase() + field.slice(1);
        currentEmployee[camelCaseField] = newValue;

        let updateRes = await fetch(`${API_URL}/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(currentEmployee),
        });

        console.log("Update Response Status:", updateRes.status);

        if (updateRes.ok) {
          document.getElementById("updateMsg").innerText =
            "Updated Successfully ✅";
          loadEmployees();
        } else {
          document.getElementById("updateMsg").innerText = "Update Failed ❌";
        }
      } catch (err) {
        console.error("Update error:", err);
        document.getElementById("updateMsg").innerText = "Update Failed ❌";
      }
    });
}

// ================= SEARCH EMPLOYEE ================= (مشروط: فقط إذا كان النموذج موجود)
if (document.getElementById("searchForm")) {
  document
    .getElementById("searchForm")
    ?.addEventListener("submit", async function (e) {
      e.preventDefault();

      let value = document.getElementById("searchValue").value;

      // مصحح: إضافة تحقق res.ok
      let res = await fetch(`${API_URL}/search/${value}`);
      if (!res.ok) {
        alert("Search failed ❌");
        return;
      }
      let data = await res.json();

      let tbody = document.querySelector("#searchTable tbody");
      tbody.innerHTML = "";

      if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6">No results found for: ${value} 😢</td></tr>`;
        return;
      }

      data.forEach((emp) => {
        // مصحح: أسماء الخصائص camelCase
        let row = `
          <tr>
            <td>${emp.id}</td>
            <td>${emp.fullName}</td>
            <td>${emp.jobTitle}</td>
            <td>${emp.department}</td>
            <td>${emp.salary}</td>
            <td>${emp.phoneNumber}</td>
            <td>${new Date(emp.hireDate).toLocaleDateString()}</td>  
          </tr>
        `;
        tbody.innerHTML += row;
      });
    });
}
