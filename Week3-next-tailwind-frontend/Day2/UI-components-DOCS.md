
---

##  Folder Structure

```
/components/ui/
  ├── Button.jsx
  ├── Input.jsx
  ├── Card.jsx
  ├── Badge.jsx
  ├── Modal.jsx
  └── index.js
```

---

##  Button Component

### Props

* `children` (node): Button content
* `variant` (string): primary | secondary | outline
* `size` (string): sm | md | lg
* `onClick` (function): Click handler

### Usage

```jsx
import { Button } from "@/components/ui";

<Button variant="primary" size="md">
  Click Me
</Button>
```

---

##  Input Component

### Props

* `type` (string): text | password | email
* `placeholder` (string): Input placeholder
* `value` (string): Controlled value
* `onChange` (function): Change handler

### Usage

```jsx
import { Input } from "@/components/ui";

<Input 
  type="text" 
  placeholder="Enter your name" 
/>
```

---

##  Card Component

### Props

* `children` (node): Card content
* `className` (string): Custom styles

### Usage

```jsx
import { Card } from "@/components/ui";

<Card>
  <h2 className="text-lg font-semibold">Card Title</h2>
  <p>This is card content</p>
</Card>
```

---

##  Badge Component

### Props

* `label` (string): Badge text
* `variant` (string): success | warning | error

### Usage

```jsx
import { Badge } from "@/components/ui";

<Badge label="Active" variant="success" />
```

---

## Modal Component

### Props

* `isOpen` (boolean): Toggle modal
* `onClose` (function): Close handler
* `children` (node): Modal content

### Usage

```jsx
import { Modal, Button } from "@/components/ui";
import { useState } from "react";

export default function Example() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>Open Modal</Button>

      <Modal isOpen={open} onClose={() => setOpen(false)}>
        <h2 className="text-xl font-bold">Modal Title</h2>
        <p>Some content inside modal</p>
      </Modal>
    </>
  );
}
```

---

##  Export File (index.js)

```js
export { default as Button } from "./Button";
export { default as Input } from "./Input";
export { default as Card } from "./Card";
export { default as Badge } from "./Badge";
export { default as Modal } from "./Modal";
```

---

## Design Principles

* Atomic Design: Build from small reusable components
* Consistency: Use Tailwind theme (colors, spacing)
* Reusability: Props-driven customization
* Responsiveness: Mobile-first design (sm, md, lg)
* Separation of Concerns: UI logic vs business logic

---


