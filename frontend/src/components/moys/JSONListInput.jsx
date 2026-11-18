import { useState, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";

export default function JSONListInput({ label, value, onChange, fields = [] }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    let parsed = [];
    try {
      parsed = typeof value === "string" ? JSON.parse(value || "[]") : value;
      if (!Array.isArray(parsed)) parsed = [];
    } catch (e) {
      parsed = [];
    }
    setItems(parsed);
  }, [value]);

  const emitChange = (newItems) => {
    setItems(newItems);
    onChange(JSON.stringify(newItems));
  };

  const addItem = () => {
    const newItem = {};
    fields.forEach((f) => {
      const safeKey = f.replace(/[^a-zA-Z0-9_]/g, "_").toLowerCase();
      newItem[safeKey] = "";
    });
    emitChange([...items, newItem]);
  };

  const removeItem = (idx) => {
    emitChange(items.filter((_, i) => i !== idx));
  };

  const updateItem = (idx, key, val) => {
    const newItems = [...items];
    newItems[idx] = { ...newItems[idx], [key]: val };
    emitChange(newItems);
  };

  const displayKey = (key) => {
    return key
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  };

  return (
    <div className="mb-8 space-y-2">
      {/* Table Title */}
      <div className="flex justify-between items-end">
        <h4 className="text-sm font-bold text-base-content">
          {label}
        </h4>
        <button
          type="button"
          onClick={addItem}
          className="text-xs flex items-center gap-1 text-primary hover:underline font-medium bg-primary/10 px-3 py-1.5 rounded"
        >
          <Plus size={14} /> Add Row
        </button>
      </div>

      {/* Table Layout */}
      <div className="overflow-x-auto w-full">
        <table className="w-full text-sm text-left border-collapse border border-base-400 bg-base-100">
          <thead>
            <tr className="bg-base-200">
              {fields.map((f) => {
                const safeKey = f.replace(/[^a-zA-Z0-9_]/g, "_").toLowerCase();
                return (
                  <th
                    key={safeKey}
                    className="border border-base-400 p-2 font-bold text-base-content/80 text-center"
                  >
                    {displayKey(safeKey)}
                  </th>
                );
              })}
              <th className="border border-base-400 p-2 w-12 text-center bg-base-200"></th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td
                  colSpan={fields.length + 1}
                  className="border border-base-400 p-4 text-center text-base-content/50 italic"
                >
                  No records added yet. Click "Add Row" to start.
                </td>
              </tr>
            ) : (
              items.map((item, i) => (
                <tr key={i} className="hover:bg-base-200/30 transition-colors">
                  {fields.map((f) => {
                    const safeKey = f
                      .replace(/[^a-zA-Z0-9_]/g, "_")
                      .toLowerCase();
                    return (
                      <td key={safeKey} className="border border-base-400 p-0">
                        <input
                          className="w-full h-full min-h-[36px] p-2 bg-transparent focus:bg-base-100 focus:outline-none focus:ring-1 focus:ring-primary focus:ring-inset"
                          value={item[safeKey] || ""}
                          onChange={(e) =>
                            updateItem(i, safeKey, e.target.value)
                          }
                          placeholder="Enter..."
                        />
                      </td>
                    );
                  })}
                  <td className="border border-base-400 p-1 text-center align-middle">
                    <button
                      type="button"
                      onClick={() => removeItem(i)}
                      className="text-error/60 hover:text-error hover:bg-error/10 p-1.5 rounded transition-colors"
                      title="Remove Row"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}