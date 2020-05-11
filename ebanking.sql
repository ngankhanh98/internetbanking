/*
 Navicat Premium Data Transfer

 Source Server         : mysql
 Source Server Type    : MySQL
 Source Server Version : 80019
 Source Host           : localhost:3306
 Source Schema         : ebanking

 Target Server Type    : MySQL
 Target Server Version : 80019
 File Encoding         : 65001

 Date: 11/05/2020 23:12:32
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for accounts
-- ----------------------------
DROP TABLE IF EXISTS `accounts`;
CREATE TABLE `accounts`  (
  `account_number` decimal(12, 0) NOT NULL,
  `pin` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `account_balance` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `type` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `customer_username` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  PRIMARY KEY (`account_number`, `customer_username`) USING BTREE,
  INDEX `ref_accounts_customers`(`customer_username`) USING BTREE,
  INDEX `account_number`(`account_number`) USING BTREE,
  CONSTRAINT `ref_account_customer` FOREIGN KEY (`customer_username`) REFERENCES `customers` (`username`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of accounts
-- ----------------------------

-- ----------------------------
-- Table structure for customerrefreshtokenext
-- ----------------------------
DROP TABLE IF EXISTS `customerrefreshtokenext`;
CREATE TABLE `customerrefreshtokenext`  (
  `username` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `refreshToken` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `rdt` datetime(6) NOT NULL,
  PRIMARY KEY (`username`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8 COLLATE = utf8_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of customerrefreshtokenext
-- ----------------------------
INSERT INTO `customerrefreshtokenext` VALUES ('ngankhanh', 'TkzGHoEkZrPqbs0xeBUW9PVtUXDsya64gOIRxnSbaSCqV9fdypA2vYMRwaActrMAY9tRGvqwUQ3MZaXM', '2020-05-11 23:07:07.000000');

-- ----------------------------
-- Table structure for customers
-- ----------------------------
DROP TABLE IF EXISTS `customers`;
CREATE TABLE `customers`  (
  `username` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `password` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `fullname` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`username`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of customers
-- ----------------------------
INSERT INTO `customers` VALUES ('ngankhanh', '$2a$08$XbavxRuWqwX5h/6iqAHIluXxZbAAUPc0VWNn4kMDE89AVylslfeLG', 'NGUYEN NGAN KHANH');

-- ----------------------------
-- Table structure for debt_reminder
-- ----------------------------
DROP TABLE IF EXISTS `debt_reminder`;
CREATE TABLE `debt_reminder`  (
  `debt_id` int(0) NOT NULL,
  `debtor` decimal(12, 0) NOT NULL,
  `creditor` decimal(12, 0) NOT NULL,
  `amount` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `initial_date` date NOT NULL,
  PRIMARY KEY (`debt_id`, `debtor`, `creditor`) USING BTREE,
  INDEX `ref_debtor_account`(`debtor`) USING BTREE,
  INDEX `ref_creditor_account`(`creditor`) USING BTREE,
  CONSTRAINT `ref_creditor_account` FOREIGN KEY (`creditor`) REFERENCES `accounts` (`account_number`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `ref_debtor_account` FOREIGN KEY (`debtor`) REFERENCES `accounts` (`account_number`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of debt_reminder
-- ----------------------------

-- ----------------------------
-- Table structure for personels
-- ----------------------------
DROP TABLE IF EXISTS `personels`;
CREATE TABLE `personels`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `fullname` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `username` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `password` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `email` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `phone` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `permission` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`, `username`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of personels
-- ----------------------------

-- ----------------------------
-- Table structure for transactions
-- ----------------------------
DROP TABLE IF EXISTS `transactions`;
CREATE TABLE `transactions`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `transaction_owner` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `account_involved` decimal(12, 0) NULL DEFAULT NULL,
  `transaction_type` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `amount` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  PRIMARY KEY (`id`, `transaction_owner`) USING BTREE,
  INDEX `ref_transactionOwner_customer`(`transaction_owner`) USING BTREE,
  INDEX `ref_accountInvolved_account`(`account_involved`) USING BTREE,
  CONSTRAINT `ref_accountInvolved_account` FOREIGN KEY (`account_involved`) REFERENCES `accounts` (`account_number`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `ref_transactionOwner_customer` FOREIGN KEY (`transaction_owner`) REFERENCES `customers` (`username`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of transactions
-- ----------------------------

SET FOREIGN_KEY_CHECKS = 1;
