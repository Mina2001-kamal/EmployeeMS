
using Microsoft.AspNetCore.Http;
using Microsoft.Data.SqlClient;
using System.Text.RegularExpressions;
using System.Text.Json; // أضفت هذا للـ JsonOptions

var builder = WebApplication.CreateBuilder(args);

// إعداد JSON لاستخدام camelCase global
builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
});

// ======= CORS =======
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();
app.UseCors("AllowAll");

// ======= Connection String =======
//string connectionString = builder.Configuration.GetConnectionString("DefaultConnection") 
//    ?? throw new Exception("Connection string not found in appsettings.json"); ;
string connectionString = "Server=.;Database=EmployeeDB;Trusted_Connection=True;TrustServerCertificate=True;";
//string connectionString = "workstation id=HR_SystemDB.mssql.somee.com;" +
//                          "packet size=4096;" +
//                          "user id=Mina_SQLLogin_3;" +
//                          "pwd=9xbhekfje7;" +
//                          "data source=HR_SystemDB.mssql.somee.com;" +
//                          "persist security info=False;" +
//                          "initial catalog=HR_SystemDB;" +
//                          "TrustServerCertificate=True;";


// ================= ADD EMPLOYEE =================
app.MapPost("/api/employees", async (HttpContext http) =>
{
    var emp = await http.Request.ReadFromJsonAsync<Employee>();

    if (emp == null)
        return Results.BadRequest("Invalid Data ❌");

    // Validations إضافية في Backend
    if (string.IsNullOrWhiteSpace(emp.FullName) ||
        string.IsNullOrWhiteSpace(emp.JobTitle) ||
        string.IsNullOrWhiteSpace(emp.Department) ||
        emp.Salary <= 0 ||
        string.IsNullOrWhiteSpace(emp.PhoneNumber))
    {
        return Results.BadRequest("Please fill all fields ❗");
    }

    // Regex validations
    if (!Regex.IsMatch(emp.FullName, @"^[a-zA-Z\s]+$") ||
        !Regex.IsMatch(emp.JobTitle, @"^[a-zA-Z\s]+$") ||
        !Regex.IsMatch(emp.Department, @"^[a-zA-Z\s]+$") ||
        !Regex.IsMatch(emp.Salary.ToString(), @"^\d+(\.\d{1,2})?$") ||
        !Regex.IsMatch(emp.PhoneNumber, @"^\d+$"))
    {
        return Results.BadRequest("Invalid format: Texts must be letters/spaces, numbers must be digits ❗");
    }

    using SqlConnection con = new(connectionString);
    string query = @"INSERT INTO Employees (FullName,JobTitle,Department,Salary,PhoneNumber)
                     VALUES (@FullName,@JobTitle,@Department,@Salary,@PhoneNumber)";

    using SqlCommand cmd = new(query, con);
    cmd.Parameters.AddWithValue("@FullName", emp.FullName);
    cmd.Parameters.AddWithValue("@JobTitle", emp.JobTitle);
    cmd.Parameters.AddWithValue("@Department", emp.Department);
    cmd.Parameters.AddWithValue("@Salary", emp.Salary);
    cmd.Parameters.AddWithValue("@PhoneNumber", emp.PhoneNumber);

    con.Open();
    cmd.ExecuteNonQuery();

    return Results.Ok("Employee Added Successfully ✅");
});


// ================= VIEW EMPLOYEES =================
app.MapGet("/api/employees", () =>
{
    List<Employee> employees = new();

    using SqlConnection con = new(connectionString);
    using SqlCommand cmd = new("SELECT * FROM Employees", con);

    con.Open();
    using SqlDataReader reader = cmd.ExecuteReader();

    while (reader.Read())
    {
        employees.Add(new Employee
        {
            Id = Convert.ToInt32(reader["EmployeeID"]),
            FullName = reader["FullName"]?.ToString() ?? "",
            JobTitle = reader["JobTitle"]?.ToString() ?? "",
            Department = reader["Department"]?.ToString() ?? "",
            Salary = Convert.ToDecimal(reader["Salary"]),
            PhoneNumber = reader["PhoneNumber"]?.ToString() ?? "",
            //HireDate = Convert.ToDateTime(reader["HireDate"])  // إضافة
            HireDate = reader["HireDate"] == DBNull.Value
                        ? DateTime.MinValue
                        : Convert.ToDateTime(reader["HireDate"])

        });
    }

    return Results.Ok(employees);
});

// ================= GET EMPLOYEE BY ID =================
app.MapGet("/api/employees/{id}", (int id) =>
{
    using SqlConnection con = new(connectionString);
    string query = "SELECT * FROM Employees WHERE EmployeeID=@id";

    using SqlCommand cmd = new(query, con);
    cmd.Parameters.AddWithValue("@id", id);

    con.Open();
    using SqlDataReader reader = cmd.ExecuteReader();

    if (reader.Read())
    {
        return Results.Ok(new Employee
        {
            Id = Convert.ToInt32(reader["EmployeeID"]),
            FullName = reader["FullName"]?.ToString() ?? "",
            JobTitle = reader["JobTitle"]?.ToString() ?? "",
            Department = reader["Department"]?.ToString() ?? "",
            Salary = Convert.ToDecimal(reader["Salary"]),
            PhoneNumber = reader["PhoneNumber"]?.ToString() ?? "",
            HireDate = reader["HireDate"] == DBNull.Value
                        ? DateTime.MinValue
                        : Convert.ToDateTime(reader["HireDate"])

        });
    }
    else
    {
        return Results.NotFound("Employee not found ❌");
    }
});

// ================= SEARCH EMPLOYEE =================
app.MapGet("/api/employees/search/{value}", (string value) =>
{
    List<Employee> results = new();

    string query = @"SELECT * FROM Employees
                     WHERE FullName LIKE @value OR
                           JobTitle LIKE @value OR
                           Department LIKE @value OR
                           PhoneNumber LIKE @value OR
                           CAST(EmployeeID AS NVARCHAR) LIKE @value OR
                           CAST(Salary AS NVARCHAR) LIKE @value";

    using SqlConnection con = new(connectionString);
    using SqlCommand cmd = new(query, con);
    cmd.Parameters.AddWithValue("@value", "%" + value + "%");

    con.Open();
    using SqlDataReader reader = cmd.ExecuteReader();

    while (reader.Read())
    {
        results.Add(new Employee
        {
            Id = Convert.ToInt32(reader["EmployeeID"]),
            FullName = reader["FullName"]?.ToString() ?? "",
            JobTitle = reader["JobTitle"]?.ToString() ?? "",
            Department = reader["Department"]?.ToString() ?? "",
            Salary = Convert.ToDecimal(reader["Salary"]),
            PhoneNumber = reader["PhoneNumber"]?.ToString() ?? "",
            //HireDate = Convert.ToDateTime(reader["HireDate"])  // إضافة
            HireDate = reader["HireDate"] == DBNull.Value
                        ? DateTime.MinValue
                        : Convert.ToDateTime(reader["HireDate"])
        });
    }

    return Results.Ok(results);
});

// ================= UPDATE EMPLOYEE =================
app.MapPut("/api/employees/{id}", async (int id, HttpContext http) =>
{
    var data = await http.Request.ReadFromJsonAsync<Employee>();

    if (data == null)
        return Results.BadRequest("Invalid Data ❌");

    // Validations للتحديث
    if (string.IsNullOrWhiteSpace(data.FullName) ||
        string.IsNullOrWhiteSpace(data.JobTitle) ||
        string.IsNullOrWhiteSpace(data.Department) ||
        data.Salary <= 0 ||
        string.IsNullOrWhiteSpace(data.PhoneNumber))
    {
        return Results.BadRequest("Please fill all fields ❗");
    }

    // Regex validations لكل حقل (مصحح: نص للحقول النصية، أرقام للرقمية)
    if (!Regex.IsMatch(data.FullName, @"^[a-zA-Z\s]+$"))
        return Results.BadRequest("Only text is accepted in these fields ❗");
    if (!Regex.IsMatch(data.JobTitle, @"^[a-zA-Z\s]+$"))
        return Results.BadRequest("Only text is accepted in these fields ❗");
    if (!Regex.IsMatch(data.Department, @"^[a-zA-Z\s]+$"))
        return Results.BadRequest("Only text is accepted in these fields ❗");
    if (!Regex.IsMatch(data.Salary.ToString(), @"^\d+$"))  // أرقام فقط، بدون كسور
        return Results.BadRequest("Only numbers are accepted in these fields ❗");
    if (!Regex.IsMatch(data.PhoneNumber, @"^\d+$"))  // أرقام فقط، بدون طول أو بداية
        return Results.BadRequest("Only numbers are accepted in these fields ❗");

    // تحقق إضافي لـ Salary: تأكد من أنه يمكن تحويله إلى decimal (مع try-catch لتجنب 500 error)
    try
    {
        if (!decimal.TryParse(data.Salary.ToString(), out _))
            return Results.BadRequest("Only numbers are accepted in these fields ❗");
    }
    catch
    {
        return Results.BadRequest("Only numbers are accepted in these fields ❗");
    }

    using SqlConnection con = new(connectionString);
    string query = @"UPDATE Employees 
                     SET FullName=@FullName,
                         JobTitle=@JobTitle,
                         Department=@Department,
                         Salary=@Salary,
                         PhoneNumber=@PhoneNumber
                     WHERE EmployeeID=@Id";

    using SqlCommand cmd = new(query, con);
    cmd.Parameters.AddWithValue("@FullName", data.FullName);
    cmd.Parameters.AddWithValue("@JobTitle", data.JobTitle);
    cmd.Parameters.AddWithValue("@Department", data.Department);
    cmd.Parameters.AddWithValue("@Salary", data.Salary);
    cmd.Parameters.AddWithValue("@PhoneNumber", data.PhoneNumber);
    cmd.Parameters.AddWithValue("@Id", id);

    con.Open();
    int rows = cmd.ExecuteNonQuery();

    return rows > 0 ? Results.Ok("Updated ✅") : Results.NotFound("Not Found ❌");
});
// ================= DELETE EMPLOYEE =================
app.MapDelete("/api/employees/{id}", (int id) =>
{
    using SqlConnection con = new(connectionString);
    string query = "DELETE FROM Employees WHERE EmployeeID=@id";

    using SqlCommand cmd = new(query, con);
    cmd.Parameters.AddWithValue("@id", id);

    con.Open();
    int rows = cmd.ExecuteNonQuery();

    return rows > 0 ? Results.Ok("Deleted ✅") : Results.NotFound("Not Found ❌");
});
app.Run();

// ================= CLASS =================
public class Employee
{
    public int Id { get; set; }
    public string FullName { get; set; } = "";
    public string JobTitle { get; set; } = "";
    public string Department { get; set; } = "";
    public decimal Salary { get; set; }
    public string PhoneNumber { get; set; } = "";
    public DateTime? HireDate { get; set; }

}