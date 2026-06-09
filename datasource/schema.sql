CREATE TABLE IF NOT EXISTS mobile_user
(
    id               BIGINT PRIMARY KEY AUTO_INCREMENT,
    phone_cipher     VARCHAR(512) NOT NULL,
    phone_hash       CHAR(64)     NOT NULL,
    password_hash    VARCHAR(128) NOT NULL,
    name             VARCHAR(30)  NULL,
    id_card_cipher   VARCHAR(512) NULL,
    id_card_hash     CHAR(64)     NULL,
    account_status   VARCHAR(20)  NOT NULL DEFAULT 'NORMAL',
    login_fail_count INT          NOT NULL DEFAULT 0,
    lock_until       DATETIME     NULL,
    created_at       DATETIME     NOT NULL,
    updated_at       DATETIME     NOT NULL,
    deleted          TINYINT      NOT NULL DEFAULT 0,
    UNIQUE KEY uk_mobile_user_phone_hash (phone_hash),
    KEY idx_mobile_user_id_card_hash (id_card_hash)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4 COMMENT ='手机端注册用户表';

CREATE TABLE IF NOT EXISTS sys_admin
(
    id                  BIGINT PRIMARY KEY AUTO_INCREMENT,
    admin_no            VARCHAR(32)  NOT NULL,
    real_name           VARCHAR(30)  NOT NULL,
    login_name          VARCHAR(64)  NOT NULL,
    password_hash       VARCHAR(128) NOT NULL,
    dept_id             BIGINT       NULL,
    phone_cipher        VARCHAR(512) NULL,
    phone_hash          CHAR(64)     NULL,
    account_status      VARCHAR(20)  NOT NULL DEFAULT 'NORMAL',
    auth_scope          VARCHAR(64)  NULL,
    login_fail_count    INT          NOT NULL DEFAULT 0,
    lock_until          DATETIME     NULL,
    password_updated_at DATETIME     NOT NULL,
    created_at          DATETIME     NOT NULL,
    updated_at          DATETIME     NOT NULL,
    deleted             TINYINT      NOT NULL DEFAULT 0,
    UNIQUE KEY uk_sys_admin_no (admin_no),
    UNIQUE KEY uk_sys_admin_login_name (login_name),
    KEY idx_sys_admin_dept_id (dept_id),
    KEY idx_sys_admin_phone_hash (phone_hash)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4 COMMENT ='后台管理员表';

CREATE TABLE IF NOT EXISTS sys_role
(
    id         BIGINT PRIMARY KEY AUTO_INCREMENT,
    role_code  VARCHAR(64) NOT NULL,
    role_name  VARCHAR(64) NOT NULL,
    created_at DATETIME    NOT NULL,
    UNIQUE KEY uk_sys_role_code (role_code)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4 COMMENT ='角色表';

CREATE TABLE IF NOT EXISTS sys_permission
(
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    permission_code VARCHAR(128) NOT NULL,
    permission_name VARCHAR(128) NOT NULL,
    created_at      DATETIME     NOT NULL,
    UNIQUE KEY uk_sys_permission_code (permission_code)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4 COMMENT ='权限表';

CREATE TABLE IF NOT EXISTS sys_admin_role
(
    id       BIGINT PRIMARY KEY AUTO_INCREMENT,
    admin_id BIGINT NOT NULL,
    role_id  BIGINT NOT NULL,
    UNIQUE KEY uk_sys_admin_role (admin_id, role_id),
    KEY idx_sys_admin_role_role_id (role_id)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4 COMMENT ='管理员角色关系表';

CREATE TABLE IF NOT EXISTS sys_role_permission
(
    id            BIGINT PRIMARY KEY AUTO_INCREMENT,
    role_id       BIGINT NOT NULL,
    permission_id BIGINT NOT NULL,
    UNIQUE KEY uk_sys_role_permission (role_id, permission_id),
    KEY idx_sys_role_permission_permission_id (permission_id)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4 COMMENT ='角色权限关系表';

CREATE TABLE IF NOT EXISTS dept
(
    id         BIGINT PRIMARY KEY AUTO_INCREMENT,
    dept_code  VARCHAR(64)  NOT NULL,
    dept_type  VARCHAR(32)  NOT NULL,
    dept_name  VARCHAR(100) NOT NULL,
    status     VARCHAR(20)  NOT NULL DEFAULT 'ENABLED',
    created_at DATETIME     NOT NULL,
    updated_at DATETIME     NOT NULL,
    deleted    TINYINT      NOT NULL DEFAULT 0,
    UNIQUE KEY uk_dept_code (dept_code),
    KEY idx_dept_type_name (dept_type, dept_name)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4 COMMENT ='部门表';

CREATE TABLE IF NOT EXISTS campus
(
    id          BIGINT PRIMARY KEY AUTO_INCREMENT,
    campus_code VARCHAR(64)  NOT NULL,
    campus_name VARCHAR(100) NOT NULL,
    status      VARCHAR(20)  NOT NULL DEFAULT 'ENABLED',
    created_at  DATETIME     NOT NULL,
    updated_at  DATETIME     NOT NULL,
    deleted     TINYINT      NOT NULL DEFAULT 0,
    UNIQUE KEY uk_campus_code (campus_code)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4 COMMENT ='校区字典表';

CREATE TABLE IF NOT EXISTS reservation
(
    id               BIGINT PRIMARY KEY AUTO_INCREMENT,
    reservation_no   VARCHAR(32)  NOT NULL,
    mobile_user_id   BIGINT       NOT NULL,
    reservation_type VARCHAR(20)  NOT NULL,
    campus_id        BIGINT       NOT NULL,
    apply_time       DATETIME     NOT NULL,
    visit_time       DATETIME     NOT NULL,
    valid_start_time DATETIME     NOT NULL,
    valid_end_time   DATETIME     NOT NULL,
    organization     VARCHAR(100) NOT NULL,
    visitor_name     VARCHAR(30)  NOT NULL,
    id_card_cipher   VARCHAR(512) NOT NULL,
    id_card_hash     CHAR(64)     NOT NULL,
    phone_cipher     VARCHAR(512) NOT NULL,
    phone_hash       CHAR(64)     NOT NULL,
    traffic_type     VARCHAR(32)  NOT NULL,
    plate_no         VARCHAR(20)  NULL,
    visit_dept_id    BIGINT       NULL,
    receptionist     VARCHAR(30)  NULL,
    visit_reason     VARCHAR(500) NULL,
    approval_status  VARCHAR(20)  NOT NULL,
    reject_reason    VARCHAR(500) NULL,
    approved_by      BIGINT       NULL,
    approved_at      DATETIME     NULL,
    created_at       DATETIME     NOT NULL,
    updated_at       DATETIME     NOT NULL,
    deleted          TINYINT      NOT NULL DEFAULT 0,
    UNIQUE KEY uk_reservation_no (reservation_no),
    KEY idx_reservation_mobile_user_id (mobile_user_id),
    KEY idx_reservation_apply_time (apply_time),
    KEY idx_reservation_visit_time (visit_time),
    KEY idx_reservation_type_status (reservation_type, approval_status),
    KEY idx_reservation_campus_visit (campus_id, visit_time),
    KEY idx_reservation_id_hash (id_card_hash),
    KEY idx_reservation_visit_dept_id (visit_dept_id)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4 COMMENT ='预约主表';

CREATE TABLE IF NOT EXISTS companion
(
    id             BIGINT PRIMARY KEY AUTO_INCREMENT,
    reservation_id BIGINT       NOT NULL,
    name           VARCHAR(30)  NOT NULL,
    id_card_cipher VARCHAR(512) NOT NULL,
    id_card_hash   CHAR(64)     NOT NULL,
    phone_cipher   VARCHAR(512) NOT NULL,
    phone_hash     CHAR(64)     NOT NULL,
    created_at     DATETIME     NOT NULL,
    KEY idx_companion_reservation_id (reservation_id),
    KEY idx_companion_id_card_hash (id_card_hash)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4 COMMENT ='随行人员表';

CREATE TABLE IF NOT EXISTS approval_record
(
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    reservation_id  BIGINT       NOT NULL,
    approver_id     BIGINT       NOT NULL,
    approval_result VARCHAR(20)  NOT NULL,
    reject_reason   VARCHAR(500) NULL,
    approved_at     DATETIME     NOT NULL,
    KEY idx_approval_record_reservation_id (reservation_id),
    KEY idx_approval_record_approver_id (approver_id)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4 COMMENT ='公务预约审核记录表';

CREATE TABLE IF NOT EXISTS audit_log
(
    id             BIGINT PRIMARY KEY AUTO_INCREMENT,
    operator_id    BIGINT       NULL,
    operator_name  VARCHAR(64)  NULL,
    operator_role  VARCHAR(255) NULL,
    operation_type VARCHAR(64)  NOT NULL,
    target_type    VARCHAR(64)  NULL,
    target_id      VARCHAR(64)  NULL,
    result         VARCHAR(20)  NOT NULL,
    ip_address     VARCHAR(64)  NULL,
    user_agent     VARCHAR(512) NULL,
    operation_time DATETIME     NOT NULL,
    detail_json    JSON         NULL,
    hmac_value     CHAR(64)     NULL,
    KEY idx_audit_log_operation_time (operation_time),
    KEY idx_audit_log_operator_name (operator_name),
    KEY idx_audit_log_operation_type (operation_type),
    KEY idx_audit_log_result (result)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4 COMMENT ='审计日志表';
