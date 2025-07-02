-- MySQL dump 10.13  Distrib 8.0.34, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: curseproject
-- ------------------------------------------------------
-- Server version	5.5.5-10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `passwordHash` varchar(255) DEFAULT NULL,
  `role` varchar(255) DEFAULT NULL,
  `avatar` varchar(225) DEFAULT NULL,
  `language` varchar(255) DEFAULT NULL,
  `theme` varchar(255) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email_UNIQUE` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Alice','alice@example.com','$2b$10$AoratjGKyo9DxmHAzwr8qOM.Pju74hGKNk57Oh5NHjh7tGtRn5IfO','reader',NULL,NULL,NULL,'2025-06-25 16:02:46','2025-07-02 11:11:27'),(2,'Alex','lex.shults@gmail.com','$2b$10$wbLwH360NmVC8nT/hJauauDD90yQjMVIhUQe0OC.EY9Lx.c.Y9YMy','admin',NULL,NULL,NULL,'2025-06-27 09:51:14','2025-06-27 09:51:14'),(4,'cdscdsdc','lex1.shults@gmail.com','$2b$10$.f7oqJxMrwRkysv1B3C.ee5UxZzDZ94edKccxfLWfaNvuOKYmXXFS','user',NULL,NULL,NULL,'2025-07-02 12:13:29','2025-07-02 12:13:29'),(5,'awdawd','','$2b$10$Og7Qbcviorqps1uzXkx7R.f51hDRYsUNQIdscVg3lbS9QXPLBc6X2','user',NULL,NULL,NULL,'2025-07-02 12:26:04','2025-07-02 12:26:04'),(6,'фыв','123','$2b$10$pDblT21LWG7S9KshzU6sf.EIQjkfPK5lhRMPVDDdgPwD4FDIZcFdW','user',NULL,NULL,NULL,'2025-07-02 12:41:01','2025-07-02 12:41:01'),(7,'цуйв','asdasd@sdf.d','$2b$10$7qeYUwwXNQiWPQVthWrn8.GzQ7CvED6uTpl51UCDL9plD.OaxrLIG','user',NULL,NULL,NULL,'2025-07-02 12:43:03','2025-07-02 12:43:03');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-07-02 14:37:49
