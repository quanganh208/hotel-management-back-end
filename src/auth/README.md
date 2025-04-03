# Hướng dẫn xác thực Google OAuth

## Giới thiệu

Hệ thống xác thực Google OAuth cho phép người dùng đăng nhập bằng tài khoản Google của họ. Quá trình này sử dụng luồng xác thực OpenID Connect để đảm bảo tính bảo mật và an toàn.

## Cài đặt

1. Đăng ký ứng dụng tại [Google Cloud Console](https://console.cloud.google.com/)
2. Tạo OAuth Client ID credentials
3. Thêm các redirect URIs được cho phép
4. Cập nhật file `.env` với Client ID từ Google:

```
GOOGLE_CLIENT_ID=your-google-client-id
```

## Luồng xác thực

1. **Phía Client**:

   - Sử dụng Google Sign-In button
   - Khi người dùng đăng nhập, nhận được `idToken` từ Google
   - Gửi `idToken` đến API của server

2. **Phía Server**:
   - Nhận `idToken` từ client
   - Xác thực token với Google API
   - Trích xuất thông tin người dùng từ token đã xác thực
   - Đăng nhập hoặc đăng ký người dùng dựa trên thông tin email

## Tính năng liên kết tài khoản

Hệ thống hỗ trợ liên kết tài khoản giữa đăng nhập thông thường và Google:

1. **Người dùng đã đăng ký bằng email/mật khẩu**:

   - Nếu người dùng đăng nhập bằng Google với cùng email, tài khoản sẽ được tự động liên kết
   - Thông tin Google ID sẽ được lưu vào tài khoản hiện có
   - Người dùng có thể đăng nhập bằng cả hai phương thức (email/mật khẩu hoặc Google)

2. **Người dùng đã đăng ký bằng Google**:
   - Thông tin tài khoản sẽ được cập nhật nếu có thay đổi từ Google
   - Vẫn đăng nhập qua Google như bình thường

## API Endpoint

### POST /auth/google-auth

**Request Body:**

```json
{
  "idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjFiZDY4NWY1Yjg0NThjY..."
}
```

**Response Success:**

```json
{
   "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
   "token_type": "Bearer",
   "user": {
      "_id": "60a1b2c3d4e5f6a7b8c9d0e1",
      "email": "user@example.com",
      "name": "User Name",
      "accountType": "GOOGLE"
   }
}
```

## Bảo mật

Hệ thống xác thực này đảm bảo tính bảo mật bằng cách:

1. Chỉ chấp nhận `idToken` từ Google và xác thực trực tiếp với Google
2. Không lưu trữ hoặc truyền các thông tin nhạy cảm
3. Sử dụng HTTPS cho tất cả các kết nối
4. Xác thực idToken với client_id đã đăng ký

## Lỗi phổ biến

- **Token không hợp lệ**: Đảm bảo token chưa hết hạn và được cấp bởi Google
- **Client ID không khớp**: Đảm bảo client ID trong .env khớp với ứng dụng đã đăng ký trên Google Cloud
- **Email không được cung cấp**: Đảm bảo ứng dụng đã được cấp quyền truy cập email

## Mô hình dữ liệu User

Người dùng có thể có các thuộc tính:

- `email`: Email của người dùng
- `name`: Tên người dùng
- `googleId`: ID duy nhất của người dùng từ Google (nếu liên kết với Google)
- `accountType`: Loại tài khoản ("LOCAL" hoặc "GOOGLE")
- `image`: Ảnh đại diện (từ Google nếu đăng nhập bằng Google)
- `password`: Mật khẩu đã mã hóa (chỉ cho tài khoản đăng ký bằng email)

## Hướng dẫn triển khai phía Client

### React

```jsx
import { GoogleLogin } from '@react-oauth/google';

const GoogleLoginButton = () => {
  const handleGoogleLogin = async (credentialResponse) => {
    try {
      const response = await fetch('your-api-url/auth/google-auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idToken: credentialResponse.credential,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Lưu token và thông tin người dùng
        localStorage.setItem('access_token', data.access_token);
        // Chuyển hướng hoặc cập nhật trạng thái
      } else {
        // Xử lý lỗi
        console.error('Đăng nhập thất bại:', data.message);
      }
    } catch (error) {
      console.error('Lỗi khi gọi API:', error);
    }
  };

  return (
    <GoogleLogin
      onSuccess={handleGoogleLogin}
      onError={() => console.log('Đăng nhập thất bại')}
    />
  );
};
```

### Vue.js

```vue
<template>
  <div>
    <div id="googleLoginButton"></div>
  </div>
</template>

<script>
export default {
  mounted() {
    this.loadGoogleSignIn();
  },
  methods: {
    loadGoogleSignIn() {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;

      script.onload = () => {
        window.google.accounts.id.initialize({
          client_id: 'YOUR_GOOGLE_CLIENT_ID',
          callback: this.handleGoogleLogin,
        });

        window.google.accounts.id.renderButton(
          document.getElementById('googleLoginButton'),
          { theme: 'outline', size: 'large' },
        );
      };

      document.head.appendChild(script);
    },

    async handleGoogleLogin(response) {
      try {
        const result = await fetch('your-api-url/auth/google-auth', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            idToken: response.credential,
          }),
        });

        const data = await result.json();

        if (result.ok) {
          // Lưu token và thông tin người dùng
          localStorage.setItem('access_token', data.access_token);
          // Chuyển hướng hoặc cập nhật trạng thái
        } else {
          console.error('Đăng nhập thất bại:', data.message);
        }
      } catch (error) {
        console.error('Lỗi khi gọi API:', error);
      }
    },
  },
};
</script>
```

## Lưu ý bảo mật

1. **Luôn xác thực phía server**: Không tin tưởng dữ liệu từ client, luôn xác thực token với Google
2. **Sử dụng HTTPS**: Đảm bảo tất cả các giao tiếp đều qua HTTPS
3. **Kiểm tra aud**: Xác minh rằng trường `aud` trong token khớp với Client ID của bạn
4. **Kiểm tra thời hạn**: Đảm bảo token chưa hết hạn
