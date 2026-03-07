# 📘 Product Query Engine Documentation

## 📌 Overview

The Product Query Engine provides dynamic filtering, searching, pagination,
sorting, and soft-deletion support for the `/api/products` endpoint.

It is implemented using a layered architecture:

Route → Controller → Service → Repository → Model → MongoDB

---

# 🔍 Query Parameters

The following query parameters are supported:

| Parameter        | Type     | Description |
|------------------|----------|-------------|
| search           | string   | Text search on `name` and `description` |
| minPrice         | number   | Minimum price filter |
| maxPrice         | number   | Maximum price filter |
| tags             | string   | Comma-separated tag list |
| page             | number   | Page number (default: 1) |
| limit            | number   | Results per page (default: 10) |
| sort             | string   | Format: field:direction (e.g., price:desc) |
| includeDeleted   | boolean  | Include soft-deleted records |

---

# 🧠 How It Works Internally

## 1️⃣ Query Builder

The service layer dynamically constructs a MongoDB query object:

```js
{
  deletedAt: null,
  $or: [
    { name: { $regex: search, $options: "i" } },
    { description: { $regex: search, $options: "i" } }
  ],
  price: { $gte: 100, $lte: 1000 },
  tags: { $in: ["phone"] }
}