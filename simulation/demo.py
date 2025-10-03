"""
Demo script for running comprehensive attack scenarios
"""

import asyncio
import time
import random
from attack_simulator import AttackSimulator

class DemoRunner:
    """Runs demonstration scenarios for the VNC Protection Platform"""
    
    def __init__(self):
        self.simulator = AttackSimulator()
        
    async def run_comprehensive_demo(self):
        """Run a comprehensive demo showing multiple attack types"""
        print("=" * 60)
        print("VNC Protection Platform - Attack Simulation Demo")
        print("=" * 60)
        
        # Scenario 1: Normal usage (baseline)
        print("\n1. Simulating normal VNC usage...")
        await self.simulate_normal_usage()
        
        # Wait between scenarios
        await asyncio.sleep(2)
        
        # Scenario 2: File exfiltration attack
        print("\n2. Running file exfiltration attack...")
        result1 = await self.simulator.run_attack("file_exfiltration", "192.168.1.100")
        print(f"   Result: {result1['result']['files_count']} files, {result1['result']['total_size_mb']}MB")
        
        await asyncio.sleep(2)
        
        # Scenario 3: Screenshot spam attack
        print("\n3. Running screenshot spam attack...")
        result2 = await self.simulator.run_attack("screenshot_spam", "10.0.0.50")
        print(f"   Result: {result2['result']['screenshot_count']} screenshots in {result2['result']['time_window_seconds']}s")
        
        await asyncio.sleep(2)
        
        # Scenario 4: Clipboard stealing
        print("\n4. Running clipboard stealing attack...")
        result3 = await self.simulator.run_attack("clipboard_stealing", "172.16.0.25")
        print(f"   Result: {result3['result']['total_operations']} operations, {result3['result']['sensitive_items']} sensitive items")
        
        await asyncio.sleep(2)
        
        # Scenario 5: Large data transfer
        print("\n5. Running large data transfer attack...")
        result4 = await self.simulator.run_attack("large_data_transfer", "192.168.2.75")
        print(f"   Result: {result4['result']['total_data_gb']}GB to {result4['result']['destination_ip']}")
        
        await asyncio.sleep(2)
        
        # Scenario 6: Credential harvesting
        print("\n6. Running credential harvesting attack...")
        result5 = await self.simulator.run_attack("credential_harvesting", "10.10.10.100")
        print(f"   Result: {result5['result']['total_credentials']} credentials from {len(result5['result']['applications_accessed'])} sources")
        
        print("\n" + "=" * 60)
        print("Demo completed! Check the dashboard for real-time detection results.")
        print("=" * 60)
        
        return {
            "scenarios_completed": 6,
            "attacks_simulated": [
                "file_exfiltration", "screenshot_spam", "clipboard_stealing",
                "large_data_transfer", "credential_harvesting"
            ],
            "demo_duration_seconds": time.time()
        }
    
    async def simulate_normal_usage(self):
        """Simulate normal VNC usage patterns for baseline"""
        print("   - Small file transfers (< 10MB)")
        print("   - Occasional screenshots (< 5 per minute)")
        print("   - Normal clipboard usage (< 10 operations per minute)")
        print("   - Regular typing patterns")
        
        # This would create baseline traffic patterns
        # For demo purposes, we'll just simulate the logging
        
    async def run_targeted_demo(self, attack_type: str):
        """Run a specific attack demonstration"""
        print(f"Running targeted demo: {attack_type}")
        
        result = await self.simulator.run_attack(attack_type)
        
        print(f"Attack Type: {result['attack_type']}")
        print(f"Target IP: {result['target_ip']}")
        print(f"Success: {result['success']}")
        print(f"Detection Likelihood: {result['result'].get('detection_likelihood', 'unknown')}")
        
        return result
        
    async def run_stress_test(self):
        """Run multiple simultaneous attacks to stress test the system"""
        print("Running stress test with multiple simultaneous attacks...")
        
        attack_types = [
            "file_exfiltration", "screenshot_spam", "clipboard_stealing",
            "large_data_transfer", "keystroke_logging"
        ]
        
        target_ips = [
            "192.168.1.10", "192.168.1.20", "192.168.1.30",
            "10.0.0.15", "172.16.0.100"
        ]
        
        # Create tasks for simultaneous execution
        tasks = []
        for i, attack_type in enumerate(attack_types):
            target_ip = target_ips[i]
            task = self.simulator.run_attack(attack_type, target_ip)
            tasks.append(task)
        
        # Run all attacks simultaneously
        results = await asyncio.gather(*tasks)
        
        print(f"Stress test completed: {len(results)} attacks executed simultaneously")
        return results

async def main():
    """Main demo function"""
    demo = DemoRunner()
    
    print("VNC Protection Platform Demo")
    print("Select demo type:")
    print("1. Comprehensive Demo (all attack types)")
    print("2. Targeted Demo (specific attack)")  
    print("3. Stress Test (simultaneous attacks)")
    print("4. Custom Simulation")
    
    # For automation, run comprehensive demo
    print("\nRunning comprehensive demo...")
    result = await demo.run_comprehensive_demo()
    
    print(f"\nDemo Summary:")
    print(f"- Scenarios completed: {result['scenarios_completed']}")
    print(f"- Attacks simulated: {', '.join(result['attacks_simulated'])}")
    
    return result

if __name__ == "__main__":
    asyncio.run(main())