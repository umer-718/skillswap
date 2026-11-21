const db = require("../config/db");

// SEND EXCHANGE REQUEST
exports.sendRequest = async (req, res) => {
    try {
        const {
            wanted_skill_id,
            offered_skill_id,
            message
        } = req.body;

        const userId = req.session.user.id;

        if (!wanted_skill_id || !offered_skill_id) {
            return res.status(400).json({
                message: "Select both skills."
            });
        }

        const [wanted] = await db.execute(
            "SELECT * FROM skills WHERE id = ?",
            [wanted_skill_id]
        );

        const [offered] = await db.execute(
            "SELECT * FROM skills WHERE id = ?",
            [offered_skill_id]
        );

        if (!wanted.length || !offered.length) {
            return res.status(404).json({
                message: "Skill not found."
            });
        }

        if (
            wanted[0].user_id === userId ||
            offered[0].user_id !== userId ||
            wanted[0].skill_type !== "OFFER" ||
            offered[0].skill_type !== "OFFER"
        ) {
            return res.status(400).json({
                message: "Invalid skill selection."
            });
        }

        const receiverId = wanted[0].user_id;

        const [existing] = await db.execute(
            `SELECT id FROM exchange_requests
             WHERE requester_id = ?
             AND receiver_id = ?
             AND offered_skill_id = ?
             AND wanted_skill_id = ?
             AND status IN ('PENDING', 'ACCEPTED')`,
            [
                userId,
                receiverId,
                offered_skill_id,
                wanted_skill_id
            ]
        );

        if (existing.length) {
            return res.status(409).json({
                message: "Request already exists."
            });
        }

        await db.execute(
            `INSERT INTO exchange_requests
            (
                requester_id,
                receiver_id,
                offered_skill_id,
                wanted_skill_id,
                message
            )
            VALUES (?, ?, ?, ?, ?)`,
            [
                userId,
                receiverId,
                offered_skill_id,
                wanted_skill_id,
                (message || "").slice(0, 500)
            ]
        );

        res.status(201).json({
            message: "Exchange request sent successfully."
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Unable to send request."
        });
    }
};


// GET USER REQUESTS
exports.getRequests = async (req, res) => {
    try {
        const userId = req.session.user.id;

        const [requests] = await db.execute(
            `SELECT
                r.*,
                requester.name AS requester_name,
                receiver.name AS receiver_name,
                offered.title AS offered_title,
                wanted.title AS wanted_title

            FROM exchange_requests r

            JOIN users requester
                ON r.requester_id = requester.id

            JOIN users receiver
                ON r.receiver_id = receiver.id

            JOIN skills offered
                ON r.offered_skill_id = offered.id

            JOIN skills wanted
                ON r.wanted_skill_id = wanted.id

            WHERE r.requester_id = ?
               OR r.receiver_id = ?

            ORDER BY r.created_at DESC`,
            [userId, userId]
        );

        res.json({ requests });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Unable to load requests."
        });
    }
};


// UPDATE REQUEST STATUS
exports.updateRequest = async (req, res) => {
    try {
        const { status } = req.body;
        const userId = req.session.user.id;

        const allowed = [
            "ACCEPTED",
            "REJECTED",
            "CANCELLED",
            "COMPLETED"
        ];

        if (!allowed.includes(status)) {
            return res.status(400).json({
                message: "Invalid request status."
            });
        }

        const [rows] = await db.execute(
            "SELECT * FROM exchange_requests WHERE id = ?",
            [req.params.id]
        );

        if (!rows.length) {
            return res.status(404).json({
                message: "Request not found."
            });
        }

        const request = rows[0];

        if (
            ["ACCEPTED", "REJECTED"].includes(status) &&
            (
                request.receiver_id !== userId ||
                request.status !== "PENDING"
            )
        ) {
            return res.status(403).json({
                message: "You cannot respond to this request."
            });
        }

        if (
            status === "CANCELLED" &&
            (
                request.requester_id !== userId ||
                request.status !== "PENDING"
            )
        ) {
            return res.status(403).json({
                message: "You cannot cancel this request."
            });
        }

        if (
            status === "COMPLETED" &&
            (
                ![request.requester_id, request.receiver_id].includes(userId) ||
                request.status !== "ACCEPTED"
            )
        ) {
            return res.status(403).json({
                message: "You cannot complete this exchange."
            });
        }

        await db.execute(
            "UPDATE exchange_requests SET status = ? WHERE id = ?",
            [status, request.id]
        );

        res.json({
            message: "Request updated successfully."
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Unable to update request."
        });
    }
};