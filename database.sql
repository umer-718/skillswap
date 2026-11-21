USE skillswap;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE skills (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(120) NOT NULL,
    category VARCHAR(80) NOT NULL,
    description TEXT NOT NULL,
    skill_type ENUM('OFFER', 'LEARN') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE
);

CREATE TABLE exchange_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    requester_id INT NOT NULL,
    receiver_id INT NOT NULL,
    offered_skill_id INT NOT NULL,
    wanted_skill_id INT NOT NULL,
    message VARCHAR(500),
    status ENUM(
        'PENDING',
        'ACCEPTED',
        'REJECTED',
        'CANCELLED',
        'COMPLETED'
    ) DEFAULT 'PENDING',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (requester_id)
    REFERENCES users(id) ON DELETE CASCADE,

    FOREIGN KEY (receiver_id)
    REFERENCES users(id) ON DELETE CASCADE,

    FOREIGN KEY (offered_skill_id)
    REFERENCES skills(id) ON DELETE CASCADE,

    FOREIGN KEY (wanted_skill_id)
    REFERENCES skills(id) ON DELETE CASCADE
);