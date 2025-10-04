// database/models/SystemMetrics.js
import { DataTypes, Model } from "sequelize";
import { sequelize } from "./index.js";

class SystemMetrics extends Model {}
SystemMetrics.init(
  {
    timestamp: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    cpuUsage: { type: DataTypes.FLOAT, defaultValue: 0.0 },
    memoryUsage: { type: DataTypes.FLOAT, defaultValue: 0.0 },
    networkIo: { type: DataTypes.FLOAT, defaultValue: 0.0 },
    activeConnections: { type: DataTypes.INTEGER, defaultValue: 0 },
    threatsBlocked: { type: DataTypes.INTEGER, defaultValue: 0 },
  },
  {
    sequelize,
    modelName: "SystemMetrics",
    tableName: "system_metrics",
  }
);

export default SystemMetrics;
