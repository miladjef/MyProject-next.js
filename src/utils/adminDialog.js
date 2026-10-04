import swal from "sweetalert";

const createField = (field) => {
  const wrapper = document.createElement("label");
  wrapper.style.display = "grid";
  wrapper.style.gap = "6px";
  wrapper.style.textAlign = "right";
  const title = document.createElement("span");
  title.textContent = field.label;
  let input;
  if (field.type === "textarea") {
    input = document.createElement("textarea");
    input.rows = field.rows || 5;
  } else if (field.type === "select") {
    input = document.createElement("select");
    for (const option of field.options || []) {
      const node = document.createElement("option");
      node.value = option.value;
      node.textContent = option.label;
      input.appendChild(node);
    }
  } else {
    input = document.createElement("input");
    input.type = field.type || "text";
  }
  input.value = field.value ?? "";
  input.name = field.name;
  input.style.width = "100%";
  input.style.padding = "10px";
  input.style.border = "1px solid #ddd";
  input.style.borderRadius = "6px";
  wrapper.append(title, input);
  return { wrapper, input };
};

const showAdminForm = async ({ title, fields }) => {
  const content = document.createElement("div");
  content.style.display = "grid";
  content.style.gap = "12px";
  const controls = fields.map(createField);
  controls.forEach(({ wrapper }) => content.appendChild(wrapper));
  const accepted = await swal({
    title,
    content,
    buttons: ["لغو", "ذخیره"],
    closeOnClickOutside: false,
  });
  if (!accepted) return null;
  return Object.fromEntries(controls.map(({ input }) => [input.name, input.value]));
};

export { showAdminForm };
