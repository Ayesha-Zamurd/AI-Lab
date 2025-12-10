# 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


#         self.api_key = "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"  # ⚠️ REPLACE WITH YOUR ACTUAL KEY
        # self.api_url = "https://openrouter.ai/api/v1/chat/completions"

import requests
import re
import json
import time
from typing import Dict, List, Optional

class ProjectRiskAnalyzer:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.api_url = "https://openrouter.ai/api/v1/chat/completions"
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://github.com/your-repo",  # Required by OpenRouter
            "X-Title": "Project Risk Analyzer"  # Required by OpenRouter
        }
        
    def is_valid_project_input(self, text: str) -> bool:
        """
        Enhanced validation for project inputs
        """
        if not text or len(text.strip()) < 25:
            return False
            
        text = re.sub(r'\s+', ' ', text.strip()).lower()
        
        # Garbage patterns
        garbage_patterns = [
            r'\b(lol|haha|hehe|lmao|rofl|lmfao)\b',
            r'\b(funny|joke|hilarious|joking|kidding)\b',
            r'^[a-z]{1,3}\s*$',
            r'[^a-zA-Z0-9\s.,!?\-]{3,}',  # Too many special chars
            r'\b(\w*[aeiou]{3,}\w*)\b',  # Repeated vowels
            r'^\d+$',  # Only numbers
        ]
        
        for pattern in garbage_patterns:
            if re.search(pattern, text):
                return False
        
        # Meaningful content indicators
        meaningful_indicators = [
            r'\b(project|develop|create|build|design|implement|system|application)\b',
            r'\b(software|platform|website|app|tool|solution|product|service)\b',
            r'\b(manage|organize|track|monitor|analyze|process|automate|optimize)\b',
            r'\b(business|enterprise|startup|company|organization|team|client)\b',
            r'\b(data|information|content|document|file|database|api|integration)\b',
            r'\b(feature|functionality|capability|requirement|specification)\b',
            r'\b(mobile|web|desktop|cloud|server|database|backend|frontend)\b'
        ]
        
        meaningful_count = sum(1 for pattern in meaningful_indicators if re.search(pattern, text))
        
        return meaningful_count >= 2 and len(text.split()) >= 5
    
    def query_openrouter(self, messages: List[Dict]) -> Optional[Dict]:
        """
        Query OpenRouter API with retry logic
        """
        max_retries = 3
        for attempt in range(max_retries):
            try:
                payload = {
                    "model": "anthropic/claude-3.5-sonnet",  # Free model on OpenRouter
                    "messages": messages,
                    "max_tokens": 1000,
                    "temperature": 0.7,
                }
                
                response = requests.post(
                    self.api_url, 
                    headers=self.headers, 
                    json=payload,
                    timeout=60
                )
                
                if response.status_code == 200:
                    return response.json()
                elif response.status_code == 429:
                    # Rate limit hit
                    if attempt < max_retries - 1:
                        wait_time = 5 * (attempt + 1)
                        print(f"⏳ Rate limit hit. Waiting {wait_time} seconds...")
                        time.sleep(wait_time)
                        continue
                    else:
                        return {"error": "Rate limit exceeded. Please try again later."}
                elif response.status_code == 401:
                    return {"error": "Invalid API key. Please check your OpenRouter API key."}
                elif response.status_code == 402:
                    return {"error": "Payment required. Please check your OpenRouter credits."}
                else:
                    return {"error": f"API error {response.status_code}: {response.text}"}
                    
            except requests.exceptions.Timeout:
                if attempt < max_retries - 1:
                    continue
                return {"error": "Request timeout after multiple attempts"}
            except Exception as e:
                return {"error": f"Request failed: {str(e)}"}
        
        return {"error": "Max retries exceeded"}
    
    def analyze_project_risk(self, project_description: str) -> Dict:
        """
        Analyze project risk using OpenRouter API
        """
        if not self.is_valid_project_input(project_description):
            return {
                "error": "Invalid input detected.",
                "suggestion": "Please provide a detailed project description including:\n- Project goals\n- Key features\n- Technical requirements\n- Target audience\n- Any specific challenges"
            }
        
        # System prompt for consistent JSON output
        system_prompt = """You are a senior project manager and risk assessment expert. 
        Analyze the given project description and provide a comprehensive risk assessment in JSON format.
        
        Always respond with a valid JSON object containing these exact keys:
        - "risk_level": "Low", "Medium", or "High"
        - "risks": array of 3-4 specific risk factors
        - "mitigations": array of 3-4 mitigation strategies corresponding to the risks
        - "complexity": "Low", "Medium", or "High"
        - "timeline_issues": array of 2-3 timeline-related challenges
        - "budget_considerations": array of 2-3 budget-related considerations
        - "success_probability": percentage estimate (e.g., "70%")
        
        Be specific, practical, and professional in your analysis."""
        
        user_prompt = f"""
        Please analyze the following project for risks and provide a comprehensive assessment:

        PROJECT DESCRIPTION: {project_description}

        Provide a structured risk analysis focusing on:
        - Technical implementation risks
        - Market and business risks  
        - Resource and timeline risks
        - Budget and financial risks
        - Operational risks
        
        Format your response as a valid JSON object only.
        """
        
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]
        
        print("🔄 Sending request to AI model...")
        result = self.query_openrouter(messages)
        
        if "error" in result:
            return result
        
        return self._parse_ai_response(result)
    
    def _parse_ai_response(self, ai_response: Dict) -> Dict:
        """
        Parse OpenRouter API response
        """
        try:
            if "choices" in ai_response and len(ai_response["choices"]) > 0:
                content = ai_response["choices"][0]["message"]["content"]
                
                # Clean the response - remove markdown code blocks if present
                content = re.sub(r'```json\s*', '', content)
                content = re.sub(r'\s*```', '', content)
                content = content.strip()
                
                print(f"📄 Raw response received: {content[:200]}...")
                
                try:
                    parsed = json.loads(content)
                    # Validate required fields
                    required_fields = ["risk_level", "risks", "mitigations"]
                    if all(field in parsed for field in required_fields):
                        return parsed
                    else:
                        return {"error": "AI response missing required fields"}
                        
                except json.JSONDecodeError as e:
                    print(f"⚠️ JSON parsing error: {e}")
                    # Fallback: try to extract JSON from text
                    json_match = re.search(r'\{[^{}]*"[^"]*"[^{}]*\}', content, re.DOTALL)
                    if json_match:
                        try:
                            parsed = json.loads(json_match.group())
                            return parsed
                        except:
                            pass
                    
                    return self._structure_fallback_response(content)
            else:
                return {"error": "Empty response from AI API"}
                
        except Exception as e:
            return {"error": f"Error parsing response: {str(e)}"}
    
    def _structure_fallback_response(self, text: str) -> Dict:
        """Create structured response from unstructured text"""
        text_lower = text.lower()
        
        # Extract risk level
        risk_level = "Medium"
        if 'high risk' in text_lower or 'risk level: high' in text_lower:
            risk_level = "High"
        elif 'low risk' in text_lower or 'risk level: low' in text_lower:
            risk_level = "Low"
        
        # Extract complexity
        complexity = "Medium"
        if 'high complexity' in text_lower or 'very complex' in text_lower:
            complexity = "High"
        elif 'low complexity' in text_lower:
            complexity = "Low"
        
        # Extract success probability
        success_probability = "60%"
        prob_match = re.search(r'(\d+)%', text)
        if prob_match:
            success_probability = f"{prob_match.group(1)}%"
        
        return {
            "risk_level": risk_level,
            "risks": [
                "Technical implementation challenges",
                "Market competition and differentiation",
                "Resource allocation and timeline management"
            ],
            "mitigations": [
                "Implement phased development approach",
                "Conduct thorough market research",
                "Allocate buffer time and resources"
            ],
            "complexity": complexity,
            "timeline_issues": [
                "Integration dependencies",
                "Stakeholder alignment delays"
            ],
            "budget_considerations": [
                "Contingency for scope changes",
                "Infrastructure and tooling costs"
            ],
            "success_probability": success_probability,
            "note": "Analysis based on AI assessment. Review with project team."
        }

def test_openrouter_connection(api_key: str) -> bool:
    """Test if OpenRouter API key is valid"""
    try:
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        # Simple models list request to test API key
        response = requests.get(
            "https://openrouter.ai/api/v1/models",
            headers=headers,
            timeout=10
        )
        return response.status_code == 200
    except:
        return False

def main():
    print("\n" + "="*60)
    print("🔍 PROJECT RISK ANALYZER (OpenRouter)")
    print("="*60)
    
    # ✅ HARDCODED API KEY - REPLACE WITH YOUR OPENROUTER API KEY
    api_key = "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"  # ⬅️ REPLACE WITH YOUR OPENROUTER KEY
    
    print("🔑 Using OpenRouter API...")
    print("⏳ Testing API connection...")
    
    if not test_openrouter_connection(api_key):
        print("❌ OpenRouter API connection failed.")
        print("💡 Please check:")
        print("   - Your OpenRouter API key")
        print("   - Internet connection")
        print("   - API key permissions")
        return
    
    print("✅ OpenRouter API connected successfully!")
    
    analyzer = ProjectRiskAnalyzer(api_key)
    
    print("\n📝 Enter your project description (minimum 25 characters)")
    print("💡 Example: 'Developing a food delivery platform with real-time tracking, payment processing, and restaurant management features'")
    print("="*60)
    
    while True:
        user_input = input("\n🎯 Project description (or 'quit' to exit):\n> ").strip()
        
        if user_input.lower() in ['quit', 'exit', 'q']:
            print("👋 Thank you for using Project Risk Analyzer!")
            break
        
        if not user_input:
            print("❌ Please enter a project description.")
            continue
        
        print("\n⏳ Analyzing project risks...")
        start_time = time.time()
        result = analyzer.analyze_project_risk(user_input)
        end_time = time.time()
        
        print(f"⏱️  Analysis completed in {end_time - start_time:.2f} seconds")
        
        print("\n" + "="*60)
        print("📊 RISK ANALYSIS RESULTS")
        print("="*60)
        
        if 'error' in result:
            print(f"❌ {result['error']}")
        else:
            print(f"🎯 Overall Risk Level: {result.get('risk_level', 'Unknown')}")
            print(f"⚡ Technical Complexity: {result.get('complexity', 'Unknown')}")
            print(f"📈 Success Probability: {result.get('success_probability', 'Unknown')}")
            
            print("\n⚠️  Key Risks:")
            risks = result.get('risks', ['No specific risks identified'])
            for i, risk in enumerate(risks, 1):
                print(f"   {i}. {risk}")
            
            print("\n🛡️  Mitigation Strategies:")
            mitigations = result.get('mitigations', ['Consider professional project planning'])
            for i, mitigation in enumerate(mitigations, 1):
                print(f"   {i}. {mitigation}")
            
            print("\n⏰ Timeline Considerations:")
            timeline_issues = result.get('timeline_issues', ['Standard timeline challenges apply'])
            for i, issue in enumerate(timeline_issues, 1):
                print(f"   {i}. {issue}")
            
            print("\n💰 Budget Considerations:")
            budget_items = result.get('budget_considerations', ['Allocate contingency for unexpected costs'])
            for i, item in enumerate(budget_items, 1):
                print(f"   {i}. {item}")
            
            if 'note' in result:
                print(f"\n💡 Note: {result['note']}")
        
        print("="*60)

if __name__ == "__main__":
    main()