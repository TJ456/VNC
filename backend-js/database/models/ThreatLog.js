// database/models/ThreatLog.js
import { DataTypes, Model } from "sequelize";
import { sequelize } from "./index.js";
import VNCSession from "./VNCSession.js";

class ThreatLog extends Model {}
ThreatLog.init(
  {
    timestamp: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    threatType: { type: DataTypes.STRING, allowNull: false },
    severity: { type: DataTypes.STRING, allowNull: false, defaultValue: "low" },
    sourceIp: { type: DataTypes.STRING },
    description: { type: DataTypes.TEXT },
    metaInfo: { type: DataTypes.JSON }, // use metaInfo instead of reserved 'metadata'
    actionTaken: { type: DataTypes.STRING },
  },
  {
    sequelize,
    modelName: "ThreatLog",
    tableName: "threat_logs",
  }
);

// association: ThreatLog.sessionId -> VNCSession.id
VNCSession.hasMany(ThreatLog, { foreignKey: "sessionId", as: "threats" });
ThreatLog.belongsTo(VNCSession, { foreignKey: "sessionId", as: "session" });

export default ThreatLog;
