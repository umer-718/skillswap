const db = require("../config/db");

exports.getSkills = async (req, res) => {
    try {
        const search = `%${(req.query.search || "").trim()}%`;

        const type = ["OFFER", "LEARN"].includes(req.query.type)
            ? req.query.type
            : "";

        let sql = `
            SELECT
                skills.*,
                users.name AS user_name
            FROM skills
            JOIN users
                ON skills.user_id = users.id
            WHERE (
                skills.title LIKE ?
                OR skills.category LIKE ?
                OR skills.description LIKE ?
            )
        `;

        const params = [search, search, search];

        if (type) {
            sql += " AND skills.skill_type = ?";
            params.push(type);
        }

        sql += " ORDER BY skills.created_at DESC LIMIT 100";

        const [skills] = await db.execute(sql, params);

        res.json({ skills });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Unable to load skills."
        });
    }
};


exports.getMySkills = async (req, res) => {
    try {
        const [skills] = await db.execute(
            `SELECT * FROM skills
             WHERE user_id = ?
             ORDER BY id DESC`,
            [req.session.user.id]
        );

        res.json({ skills });

    } catch (error) {
        res.status(500).json({
            message: "Unable to load your skills."
        });
    }
};


exports.addSkill = async (req, res) => {
    try {
        const {
            title,
            category,
            description,
            skill_type
        } = req.body;

        if (
            !title?.trim() ||
            !category?.trim() ||
            !description?.trim() ||
            !["OFFER", "LEARN"].includes(skill_type)
        ) {
            return res.status(400).json({
                message: "Please complete all skill fields."
            });
        }

        const [result] = await db.execute(
            `INSERT INTO skills
            (user_id, title, category, description, skill_type)
            VALUES (?, ?, ?, ?, ?)`,
            [
                req.session.user.id,
                title.trim(),
                category.trim(),
                description.trim(),
                skill_type
            ]
        );

        res.status(201).json({
            message: "Skill added successfully.",
            id: result.insertId
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Unable to add skill."
        });
    }
};


exports.deleteSkill = async (req, res) => {
    try {
        const [result] = await db.execute(
            `DELETE FROM skills
             WHERE id = ? AND user_id = ?`,
            [req.params.id, req.session.user.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Skill not found."
            });
        }

        res.json({
            message: "Skill deleted successfully."
        });

    } catch (error) {
        res.status(500).json({
            message: "Unable to delete skill."
        });
    }
};