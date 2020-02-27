--
-- Table structure for table `live_streams`
--

DROP TABLE IF EXISTS `live_streams`;
CREATE TABLE IF NOT EXISTS `live_streams` (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `stream_id` bigint(20) UNSIGNED NOT NULL,
  `title` varchar(256) NOT NULL,
  `name` varchar(64) NOT NULL,
  `url` varchar(128) NOT NULL,
  `thumbnail` varchar(192) NOT NULL,
  `viewers` int(11) NOT NULL,
  `started_at` datetime NOT NULL,
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
