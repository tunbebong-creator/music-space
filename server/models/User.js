const User = {
  table: "Users",
  fields: {
    Id: "bigint",
    Email: "nvarchar",
    PasswordHash: "nvarchar",
    Role: "varchar", // 'customer' | 'manager'
    CreatedAt: "datetime2",
  },
};
module.exports = User;
