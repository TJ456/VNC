// database/models/VNCSession.js
import { DataTypes, Model } from "sequelize";
import { sequelize } from "./index.js";

class VNCSession extends Model {}
VNCSession.init(
  {
    user: { type: DataTypes.STRING, allowNull: false, defaultValue: "unknown" },
    clientIp: { type: DataTypes.STRING, allowNull: false },
    serverIp: { type: DataTypes.STRING },
    startTime: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    endTime: { type: DataTypes.DATE },
    status: { type: DataTypes.ENUM("active", "closed", "error"), defaultValue: "active" },
    dataTransferred: { type: DataTypes.BIGINT, defaultValue: 0 }, // bytes
    riskScore: { type: DataTypes.FLOAT, defaultValue: 0.0 },
  },
  {
    sequelize,
    modelName: "VNCSession",
    tableName: "vncsessions",
  }
);

export default VNCSession;
