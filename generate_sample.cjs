const XLSX = require('xlsx');
const wb = XLSX.utils.book_new();
const data = [
    { Code: "TEST_IMP_01", Name: "Imported Item 1", Brand: "New Brand A", Model: "Model X" },
    { Code: "TEST_IMP_02", Name: "Imported Item 2", Brand: "Existing Brand", Model: "New Model Y" },
    { Code: "TEST_IMP_03", Name: "Imported Item 3", Brand: "New Brand A", Model: "Model Z" }
];
const ws = XLSX.utils.json_to_sheet(data);
XLSX.utils.book_append_sheet(wb, ws, "Items");
XLSX.writeFile(wb, "items_sample.xlsx");
console.log("items_sample.xlsx created successfully");
