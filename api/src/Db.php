<?php
declare(strict_types=1);

final class Db {
  private static ?PDO $pdo = null;

  public static function pdo(): PDO {
    if (self::$pdo === null) {
      $c = cfg('db');
      $dsn = "mysql:host={$c['host']};port={$c['port']};dbname={$c['name']};charset=utf8mb4";
      self::$pdo = new PDO($dsn, $c['user'], $c['password'], [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
      ]);
    }
    return self::$pdo;
  }

  public static function run(string $sql, array $params = []): PDOStatement {
    $st = self::pdo()->prepare($sql);
    $st->execute($params);
    return $st;
  }

  public static function all(string $sql, array $params = []): array {
    return self::run($sql, $params)->fetchAll();
  }

  public static function one(string $sql, array $params = []): ?array {
    $row = self::run($sql, $params)->fetch();
    return $row === false ? null : $row;
  }
}
