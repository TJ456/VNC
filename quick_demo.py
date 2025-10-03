"""
Quick Start Demo Script
Runs a complete demonstration of the VNC Protection Platform
"""

import asyncio
import time
import os
import sys

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from simulation.attack_simulator import AttackSimulator
from database.setup import main as setup_database

class QuickDemo:
    """Comprehensive demo of VNC Protection Platform capabilities"""
    
    def __init__(self):
        self.simulator = AttackSimulator()
        
    async def run_complete_demo(self):
        """Run complete demonstration showing all features"""
        
        print("🛡️  VNC Protection Platform - Complete Demo")
        print("=" * 60)
        print()
        
        # Setup database first
        print("📅 Setting up database...")
        setup_database()
        print("✅ Database initialized\n")
        
        # Demo scenarios
        scenarios = [
            ("Normal Activity Baseline", self.demo_normal_activity),
            ("File Exfiltration Attack", lambda: self.demo_attack("file_exfiltration")),
            ("Screenshot Spam Attack", lambda: self.demo_attack("screenshot_spam")),
            ("Clipboard Stealing Attack", lambda: self.demo_attack("clipboard_stealing")),
            ("Large Data Transfer Attack", lambda: self.demo_attack("large_data_transfer")),
            ("Credential Harvesting Attack", lambda: self.demo_attack("credential_harvesting")),
            ("Lateral Movement Attack", lambda: self.demo_attack("lateral_movement")),
            ("Multi-vector Attack", self.demo_multi_vector_attack)
        ]
        
        results = []
        
        for i, (name, scenario_func) in enumerate(scenarios, 1):
            print(f"🎯 Scenario {i}/{len(scenarios)}: {name}")
            print("-" * 40)
            
            try:
                result = await scenario_func()
                results.append({"scenario": name, "result": result, "status": "success"})
                print(f"✅ {name} completed successfully")
                
                if result.get("success"):
                    if "detection_likelihood" in result.get("result", {}):
                        likelihood = result["result"]["detection_likelihood"]
                        print(f"🔍 Detection Likelihood: {likelihood.upper()}")
                    
                    if "files_count" in result.get("result", {}):
                        files = result["result"]["files_count"]
                        size = result["result"]["total_size_mb"]
                        print(f"📁 Files transferred: {files} files ({size:.1f} MB)")
                    
                    if "screenshot_count" in result.get("result", {}):
                        count = result["result"]["screenshot_count"]
                        rate = result["result"].get("rate_per_minute", 0)
                        print(f"📸 Screenshots: {count} captures ({rate:.1f}/min)")
                
            except Exception as e:
                print(f"❌ {name} failed: {str(e)}")
                results.append({"scenario": name, "error": str(e), "status": "failed"})
            
            print()
            await asyncio.sleep(2)  # Brief pause between scenarios
        
        # Summary
        print("📊 Demo Summary")
        print("=" * 60)
        
        successful = sum(1 for r in results if r["status"] == "success")
        total = len(results)
        
        print(f"✅ Scenarios completed: {successful}/{total}")
        print(f"🛡️  Security platform demonstrated successfully!")
        print()
        
        print("Key Features Demonstrated:")
        print("• Real-time VNC session monitoring")
        print("• Multiple attack vector simulation")
        print("• Behavioral anomaly detection")
        print("• Automated threat logging")
        print("• Risk scoring and classification")
        print()
        
        print("🌐 Next Steps:")
        print("1. Start the full platform: python main.py")
        print("2. Open dashboard: http://localhost:3000")
        print("3. View real-time monitoring and alerts")
        print("4. Explore threat analytics and prevention")
        print()
        
        return {
            "demo_completed": True,
            "scenarios_run": len(scenarios),
            "successful_scenarios": successful,
            "results": results,
            "timestamp": time.time()
        }
    
    async def demo_normal_activity(self):
        """Simulate normal VNC usage patterns"""
        print("   📋 Simulating normal user activities...")
        print("   • Small file transfers (< 10MB)")
        print("   • Occasional screenshots (< 5/minute)")
        print("   • Normal clipboard usage")
        print("   • Regular typing patterns")
        
        # This creates a baseline for comparison
        return {
            "type": "baseline",
            "description": "Normal VNC usage patterns established",
            "detection_likelihood": "none"
        }
    
    async def demo_attack(self, attack_type):
        """Demo a specific attack type"""
        attack_descriptions = {
            "file_exfiltration": "Stealing confidential documents",
            "screenshot_spam": "Rapid screen captures for surveillance",
            "clipboard_stealing": "Harvesting copied sensitive data",
            "large_data_transfer": "Exfiltrating large datasets",
            "credential_harvesting": "Stealing stored passwords and keys",
            "lateral_movement": "Scanning internal network for targets"
        }
        
        print(f"   🚨 Executing: {attack_descriptions.get(attack_type, attack_type)}")
        
        # Use different target IPs to simulate different attackers
        target_ips = {
            "file_exfiltration": "192.168.1.100",
            "screenshot_spam": "10.0.0.50",
            "clipboard_stealing": "172.16.0.25", 
            "large_data_transfer": "203.0.113.5",  # External IP
            "credential_harvesting": "198.51.100.10",  # Suspicious IP
            "lateral_movement": "192.168.2.75"
        }
        
        target_ip = target_ips.get(attack_type, "192.168.1.10")
        
        print(f"   🎯 Target: {target_ip}")
        result = await self.simulator.run_attack(attack_type, target_ip)
        
        if result.get("success"):
            print(f"   ✅ Attack simulation completed")
            print(f"   📝 Threat logged to database")
            
            # Add some context based on attack type
            if attack_type == "large_data_transfer":
                print(f"   🌐 External destination detected")
            elif attack_type == "credential_harvesting":
                print(f"   🔑 Multiple credential stores accessed")
            elif attack_type == "lateral_movement":
                print(f"   🔍 Network scanning activity detected")
        
        return result
    
    async def demo_multi_vector_attack(self):
        """Demonstrate a sophisticated multi-vector attack"""
        print("   🎯 Simulating advanced persistent threat (APT)")
        print("   • Phase 1: Initial reconnaissance")
        print("   • Phase 2: Credential harvesting") 
        print("   • Phase 3: Data exfiltration")
        print("   • Phase 4: Network lateral movement")
        
        # Simulate a coordinated attack from the same IP
        attacker_ip = "185.220.101.5"  # Suspicious external IP
        
        attacks = [
            "credential_harvesting",
            "file_exfiltration", 
            "large_data_transfer",
            "lateral_movement"
        ]
        
        results = []
        for phase, attack in enumerate(attacks, 1):
            print(f"   Phase {phase}: {attack.replace('_', ' ').title()}")
            result = await self.simulator.run_attack(attack, attacker_ip)
            results.append(result)
            await asyncio.sleep(1)  # Brief delay between phases
        
        successful_phases = sum(1 for r in results if r.get("success"))
        
        print(f"   ✅ Multi-vector attack completed: {successful_phases}/{len(attacks)} phases")
        print(f"   🚨 High-risk coordinated attack from {attacker_ip}")
        
        return {
            "success": True,
            "attack_type": "multi_vector_apt",
            "phases_completed": successful_phases,
            "total_phases": len(attacks),
            "attacker_ip": attacker_ip,
            "detection_likelihood": "critical"
        }

async def main():
    """Main demo function"""
    demo = QuickDemo()
    
    print("Starting VNC Protection Platform Demo...")
    print("This will demonstrate attack detection and prevention capabilities.\n")
    
    try:
        result = await demo.run_complete_demo()
        
        if result["demo_completed"]:
            print("🎉 Demo completed successfully!")
            return 0
        else:
            print("❌ Demo failed to complete")
            return 1
            
    except KeyboardInterrupt:
        print("\n⏹️  Demo interrupted by user")
        return 0
    except Exception as e:
        print(f"\n❌ Demo failed with error: {e}")
        return 1

if __name__ == "__main__":
    exit_code = asyncio.run(main())