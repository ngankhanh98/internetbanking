# NKL Banking :D
Là server, cung cấp API để liên kết với ngân hàng khác: MPBank, S2QBank. Là client, sử dụng API của 2 ngân hàng này 💰

## Table of content
- [Cài đặt](#---cài-đặt)
    + [Source code](#source-code)
- [Chạy thử](#---chạy-thử)
    + [Postman](#postman)
    + [Import Postman collection](#import-postman-collection)

- [Phụ lục. Tài liệu kỹ thuật](#phụ-lục-tài-liệu-kỹ-thuật)
    + [Qui trình client (MPBank, S2QBank) kết nối & dùng API](#qui-trình-client-mpbank-s2qbank-kết-nối--dùng-api)
      - [Giao tiếp in person](#giao-tiếp-in-person)
      - [MPBank, S2QBank gửi request lên NKLBanks server](#mpbank-s2qbank-gửi-request-lên-nklbanks-server)
    + [NKLBank server nhận và xử lý request](#nklbank-server-nhận-và-xử-lý-request)
      - [Đây là những gì NKLBank nhận được](#đây-là-những-gì-nklbank-nhận-được)
      - [Đây là những gì NKLBank sẽ làm](#đây-là-những-gì-nklbank-sẽ-làm)
      - [Đây là lý do NKBank](#đây-là-lý-do-nkbank)
        * [Không tách riêng method GET cho query account info và method POST cho transaction tiền](#không-tách-riêng-method-get-cho-query-account-info-và-method-post-cho-transaction-tiền)
- [Acknowledge](#acknowledge)
	
## 📦 Cài đặt
Bạn cần [Node.js](https://nodejs.org/en/) để chạy client sử dụng API của MPBank và S2QBank.

#### Source code
Bạn có thể download từ github.com hoặc dùng [git](https://git-scm.com/) bash:
```bash
# Clone this repository
$ git clone https://github.com/hhoangluu/internetbanking.git
$ cd internetbanking

# Checkout branch
$ git checkout master

# Install essential packages
$ npm i

# Run in localhost
$ npm start
```
Một web app đang chạy ở  `http://localhost:3000/`. Web app/server này cũng đang chạy mặc định ở https://nklbank.herokuapp.com/.


## 🧪 Chạy thử

#### Postman
Cài đặt và sử dụng [Postman](https://www.postman.com/) để kiểm tra các API.

#### Import Postman collection
Trong Postman, nhấn **File > Import...**, drop file [**internetbanking.postman_collection.json**](https://github.com/hhoangluu/internetbanking/blob/master/internetbanking.postman_collection.json).

Mỗi Request có `req.body` và `req.headers` valid. Nhấn **Send** để xem kết quả.


## Phụ lục. Tài liệu kỹ thuật
This section shows how we did and why we did it that way for this project.

### Qui trình client (MPBank, S2QBank) kết nối & dùng API
#### Giao tiếp in person
Trước hết, đại diện MPBank và S2QBank liên hệ với NKLBank (this) để cung cấp một `partner_code`,`email`, `public PGP key` dùng mãi mãi.

#### MPBank, S2QBank gửi request lên NKLBanks server
Từ Postman, các trường được yêu cầu gồm:
```js
Method: POST
const { transaction_type, source_account, target_account, amount_money } = req.body
const { partner_code } = req.headers
```
Tuy nhiên, khi dùng axios post lên server, nhiêu thông tin đây chưa đủ. Bạn, client, cần làm sao để ra thứ NKLBank server thực sự cần:
```js
Method: POST
const { partner_code, timestamp, api_signature } = req.headers
const { data, signed_data } = req.body

// data = { transaction_type, source_account, target_account, amount_money }
// timestamp = now
// api_signature = hash(data, timestamp, secret_key)
// signed_data = transaction_type == '?' null : PGP signature+data
```
### NKLBank server nhận và xử lý request
#### Đây là những gì NKLBank nhận được
```js
const { partner_code, timestamp, api_signature } = req.headers
const { data, signed_data } = req.body
```
#### Đây là những gì NKLBank sẽ làm
1. Check `timestamp` để xem gói tin có quá hạn chưa (quá 2 phút)
2. Query `secret_key` từ `partner_code` trong cơ sở dữ liệu.
3. Giải hash bằng `secret_key`, check xem trường `data` có match với `req.body.data` không.
4. Nếu có `signed_data`, nghĩa là có transaction 💰, cần verify `signed_data`<br>
5. Thực hiện query account information.

#### Đây là lý do NKBank
##### Không tách riêng method GET cho query account info và method POST cho transaction tiền
NKLBank chỉ thấy duy nhất một vấn đề của GET account info là lỗi **404-Page not found** trả về khi query sai `account_number`. Đây là misleading error. Error trả về nên là, **Account not found** hoặc **No information found of such account**... gì cũng được, quan trọng là ta tùy chỉnh được error.message để client thực sự hiểu lỗi gì.<br>
_Với lại, thích viết chung một method thôi, cơ bản cũng chỉ thay transaction_type = '+'_


## 🙏 Acknowledge
All essential knowledge is provided step-by-step by the lecturer, Mr. Dang Khoa.


-------------------------------------------------------------------
# Do not continue to read
#### Step-by-step test
After importing, you'll find in tab **Collections** a folder called **ebanking** with the structure:
```
ebanking
├───customer
|     ├───GET detail
|     └───POST update
└───auth
      ├───POST login
      └───POST refresh token
```

Take this flow to test:

**1. POST login**
```bash
# Input: req.body
{
    "username": "ngankhanh",
    "password": "123456"
}

# Output:
{
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6Im5nYW5raGFuaCIsImlhdCI6MTU4OTIxMjczOSwiZXhwIjoxNTg5MjEzMzM5fQ._FQrFUtfZU-1oRfFx6UoMH9EqIaQiFgRzkAxlYNigVg",
    "refreshToken": "8q4RU8bVnlye3Glsl1QopzrCdtsDIKcP6EVlJBRdii8wlbDEF4KFPKMj7ho2CVbAOUeTYkANWBvnI52g"
}
```
**2. GET detail**
```bash
# Input
req.headers['x-access-token'] = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6Im5nYW5raGFuaCIsImlhdCI6MTU4OTIxMjczOSwiZXhwIjoxNTg5MjEzMzM5fQ._FQrFUtfZU-1oRfFx6UoMH9EqIaQiFgRzkAxlYNigVg"

# Output
[
    {
        "username": "ngankhanh",
        "password": "$2a$08$toGVP5QOdSDZn3BGmrEw9OdLmoXPGK2up4.kI4p6Nq0PNbk6rKDSK",
        "fullname": "NGUYEN NGAN KHANH"
    }
]
```
**2. POST update**
```bash
# Input
req.headers['x-access-token'] = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6Im5nYW5raGFuaCIsImlhdCI6MTU4OTIxMjczOSwiZXhwIjoxNTg5MjEzMzM5fQ._FQrFUtfZU-1oRfFx6UoMH9EqIaQiFgRzkAxlYNigVg"

req.body:
{
	"password": "00000",
	"fullname": "NGUYEN NGAN KHANH"
}
# Output: Data record with username 'ngankhanh' (decode by 'x-access-token') have altered
```
**4. go to POST login when token expired**

