INSERT IGNORE INTO campus (id, campus_code, campus_name, status, created_at, updated_at, deleted) VALUES
  (1, 'MAIN', '主校区', 'ENABLED', NOW(), NOW(), 0),
  (2, 'EAST', '东校区', 'ENABLED', NOW(), NOW(), 0),
  (3, 'SOUTH', '南校区', 'ENABLED', NOW(), NOW(), 0);

INSERT IGNORE INTO dept (id, dept_code, dept_type, dept_name, status, created_at, updated_at, deleted) VALUES
  (1, 'SECURITY', '行政部门', '保卫处', 'ENABLED', NOW(), NOW(), 0),
  (2, 'CS', '学院', '计算机学院', 'ENABLED', NOW(), NOW(), 0);

INSERT IGNORE INTO sys_role (id, role_code, role_name, created_at) VALUES
  (1, 'SCHOOL_ADMIN', '学校管理员', NOW()),
  (2, 'DEPT_ADMIN', '部门管理员', NOW()),
  (3, 'SYSTEM_ADMIN', '系统管理员', NOW()),
  (4, 'AUDIT_ADMIN', '审计管理员', NOW());

INSERT IGNORE INTO sys_permission (id, permission_code, permission_name, created_at) VALUES
  (1, 'admin:manage', '管理员管理', NOW()),
  (2, 'dept:manage', '部门管理', NOW()),
  (3, 'public:query', '社会公众预约查询统计', NOW()),
  (4, 'official:query', '公务预约查询统计', NOW()),
  (5, 'official:review', '公务预约审核', NOW()),
  (6, 'audit:query', '审计日志查询', NOW()),
  (7, 'role:manage', '角色权限配置', NOW());

INSERT IGNORE INTO sys_role_permission (role_id, permission_id) VALUES
  (1, 1), (1, 2), (1, 3), (1, 4), (1, 5),
  (2, 4), (2, 5),
  (3, 1), (3, 2), (3, 7),
  (4, 6);

-- 初始账号：admin / Admin123!
INSERT IGNORE INTO sys_admin (
  id, admin_no, real_name, login_name, password_hash, dept_id, phone_cipher, phone_hash,
  account_status, auth_scope, login_fail_count, lock_until, password_updated_at, created_at, updated_at, deleted
) VALUES (
  1, 'A00000001', '系统管理员', 'admin',
  '$2b$10$yv5E6tclRgaUWPkgZRX8FuNoAVDG7sJJLB.ul7RXX6uC2iouLcqMm',
  1, NULL, NULL, 'NORMAL', 'ALL', 0, NULL, NOW(), NOW(), NOW(), 0
);

INSERT IGNORE INTO sys_admin_role (admin_id, role_id) VALUES
  (1, 1),
  (1, 3);
