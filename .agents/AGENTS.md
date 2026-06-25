# Lỗi vi phạm Shadcn Rules đã phát hiện

Trong quá trình xây dựng Form Auth (Login, Register) và Floating Input, agent đã vi phạm các rules sau đây từ `shadcn/SKILL.md` và `rules/forms.md`:

1. **[Forms] Không dùng `FieldGroup` và `Field`**:
   - **Lỗi**: Sử dụng thẻ `<form className="flex flex-col gap-4">` và tự bọc field bằng `div.flex.flex-col`.
   - **Rule**: Phải luôn dùng `FieldGroup` (cho form) và `Field` (cho từng input) thay vì dùng `div` kèm `space-y-*` hoặc `flex flex-col gap-*`.

2. **[Forms] Đặt Button trực tiếp vào Input (FloatingPasswordInput)**:
   - **Lỗi**: Tạo component custom `div.relative` và nhét `button` (chứa icon Eye) vào cùng cấp với `input` bằng `absolute right-3 top-1/2`.
   - **Rule**: Tuyệt đối không nhét Button vào Input bằng absolute positioning. Phải dùng `InputGroup` + `InputGroupAddon` để chứa nút nhấn bên trong Input.

3. **[Icons] Override size trực tiếp lên Icon**:
   - **Lỗi**: Sử dụng `<Eye className="size-[18px]" />` trong nút show/hide password.
   - **Rule**: Không được truyền class override kích thước (`size-4`, `w-4 h-4`, `size-[18px]`) vào các icon nằm trong component. Hệ thống đã tự handle size thông qua CSS.

4. **[Composition] Truyền `isPending` / `isLoading` vào Button**:
   - **Lỗi**: Truyền prop `<Button isPending={mutation.isPending} pendingText="...">` trong các trang Auth.
   - **Rule**: Button không có các state loading. Phải tự compose bằng cách truyền prop `disabled` và nhét component `<Spinner data-icon="inline-start" />` vào bên trong Button thay vì viết prop.
