# Internet Banking
An API to provide basic features for an Internet Banking web app 💸💰

## 📦 Installation
This repo need [Node.js](https://nodejs.org/en/) and [mySQL](https://www.mysql.com/), do make sure you installed it already.

#### Database mySQL
Run this script to create the certain database in you localhost: [**ebanking.sql**](https://github.com/hhoangluu/internetbanking/blob/register-login--khanh/ebanking.sql)

#### Source code
From your command line (you're supposed to have [git](https://git-scm.com/) already installed in your environment)
```bash
# Clone this repository
$ git clone https://github.com/hhoangluu/internetbanking.git
$ cd internetbanking

# Checkout branch
$ git checkout register-login--khanh

# Install essential packages
$ npm i

# Run in localhost
$ npm start
```
Webservice should be run at your `http://localhost:3000/`


## 🧪 Testing guidline

#### Postman installing
You are to install [Postman](https://www.postman.com/) and get used to the software.

#### Import Postman collection
All functions supported so far are listed in one Postman collection file. To import it, do follow these steps: hit **File > Import...**, drop file [**ebanking.postman_collection.js**](https://github.com/hhoangluu/internetbanking/blob/register-login--khanh/ebanking.postman_collection.json), and you're good to go.

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


## 🙏 Acknowledge
All essential knowledge is provided step-by-step by the lecturer, Mr. Dang Khoa.
