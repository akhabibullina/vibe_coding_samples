#!/usr/bin/env python3
"""
Database Query Agent 🐶
A friendly agent that answers questions about your database.txt file!

Usage: python database_agent.py
"""

import csv
import re
import sys
from pathlib import Path

class DatabaseAgent:
    def __init__(self, db_file="database.txt"):
        self.db_file = db_file
        self.data = {}
        self.load_database()
    
    def load_database(self):
        """Load the database from the text file"""
        try:
            # Check if file exists in current directory or puppy_files
            file_paths = [self.db_file, f"puppy_files/{self.db_file}"]
            db_path = None
            
            for path in file_paths:
                if Path(path).exists():
                    db_path = path
                    break
            
            if not db_path:
                print(f"🚫 Database file '{self.db_file}' not found!")
                return
            
            with open(db_path, 'r', encoding='utf-8') as file:
                lines = file.readlines()
                
            # Skip comment lines and empty lines
            csv_lines = []
            for line in lines:
                line = line.strip()
                if line and not line.startswith('#'):
                    csv_lines.append(line)
            
            # Parse CSV data
            if csv_lines:
                reader = csv.DictReader(csv_lines)
                for row in reader:
                    name = row.get('name', '').strip()
                    description = row.get('description', '').strip()
                    if name and description:
                        self.data[name.lower()] = {
                            'name': name,
                            'description': description
                        }
            
            print(f"🐶 Loaded {len(self.data)} records from {db_path}")
            
        except Exception as e:
            print(f"🚫 Error loading database: {e}")
    
    def search_by_name(self, query):
        """Search for exact or partial name matches"""
        query = query.lower().strip()
        
        # Exact match first
        if query in self.data:
            return [self.data[query]]
        
        # Partial matches
        matches = []
        for key, item in self.data.items():
            if query in key or query in item['name'].lower():
                matches.append(item)
        
        return matches
    
    def search_by_description(self, query):
        """Search in descriptions"""
        query = query.lower().strip()
        matches = []
        
        for item in self.data.values():
            if query in item['description'].lower():
                matches.append(item)
        
        return matches
    
    def list_all_items(self):
        """Return all items in the database"""
        return list(self.data.values())
    
    def process_question(self, question):
        """Process natural language questions"""
        question = question.lower().strip()
        
        # Remove question words and punctuation
        question_clean = re.sub(r'[?!.,]', '', question)
        
        # Different types of questions
        if any(phrase in question for phrase in ['what is', 'tell me about', 'describe']):
            # Extract the item name after these phrases
            patterns = [
                r'what is (?:a |an |the )?(.+?)(?:\?|$)',
                r'tell me about (?:a |an |the )?(.+?)(?:\?|$)',
                r'describe (?:a |an |the )?(.+?)(?:\?|$)'
            ]
            
            for pattern in patterns:
                match = re.search(pattern, question)
                if match:
                    item_name = match.group(1).strip()
                    # Try both name and description search
                    name_results = self.search_by_name(item_name)
                    if name_results:
                        return name_results
                    # If no name match, try description search
                    desc_results = self.search_by_description(item_name)
                    if desc_results:
                        return desc_results
        
        elif any(phrase in question for phrase in ['list', 'show all', 'all items']):
            return self.list_all_items()
        
        elif any(phrase in question for phrase in ['how many', 'count', 'number of']):
            # Count queries
            if 'total' in question or 'all' in question:
                count = len(self.data)
                return [{'name': 'Count', 'description': f'Total items in database: {count}'}]
            else:
                # Try to count specific things
                words = question_clean.split()
                for word in words:
                    if len(word) > 2:
                        results = self.search_by_description(word)
                        if results:
                            count = len(results)
                            return [{'name': 'Count', 'description': f'Found {count} items matching "{word}"'}]
                # Default to total count
                count = len(self.data)
                return [{'name': 'Count', 'description': f'Total items in database: {count}'}]
        
        elif any(phrase in question for phrase in ['find', 'search']):
            # Extract search term
            if 'find' in question:
                match = re.search(r'find (.+?)(?:\?|$)', question)
            else:
                match = re.search(r'search (?:for )?(.+?)(?:\?|$)', question)
            
            if match:
                search_term = match.group(1).strip()
                # Try both name and description search
                name_results = self.search_by_name(search_term)
                desc_results = self.search_by_description(search_term)
                
                # Combine and deduplicate
                all_results = name_results + desc_results
                seen = set()
                unique_results = []
                for item in all_results:
                    if item['name'] not in seen:
                        unique_results.append(item)
                        seen.add(item['name'])
                return unique_results
        
        else:
            # Try to find any mentioned words in the database
            words = question_clean.split()
            for word in words:
                if len(word) > 2:  # Skip very short words
                    results = self.search_by_name(word)
                    if results:
                        return results
                    # Also try description search for the word
                    results = self.search_by_description(word)
                    if results:
                        return results
        
        return []
    
    def format_response(self, results, question):
        """Format the response based on results"""
        if not results:
            return "🤔 I couldn't find anything about that in the database. Try asking about something else!"
        
        if len(results) == 1:
            item = results[0]
            return f"🐶 **{item['name']}**: {item['description']}"
        
        else:
            response = f"🐶 I found {len(results)} matches:\n\n"
            for i, item in enumerate(results, 1):
                response += f"{i}. **{item['name']}**: {item['description']}\n"
            return response
    
    def chat(self):
        """Start the interactive chat interface"""
        print("\n🐶 Hello! I'm your Database Agent!")
        print("Ask me questions about the items in your database.")
        print("\nExample questions:")
        print("  • What is an apple?")
        print("  • Tell me about coffee")
        print("  • List all items")
        print("  • Find fruit")
        print("  • Search for musical")
        print("  • How many items total?")
        print("  • Count fruits")
        print("\nType 'quit' or 'exit' to stop.\n")
        
        while True:
            try:
                question = input("🤔 Ask me: ").strip()
                
                if question.lower() in ['quit', 'exit', 'bye', 'stop']:
                    print("🐶 Goodbye! Thanks for using the Database Agent!")
                    break
                
                if not question:
                    continue
                
                results = self.process_question(question)
                response = self.format_response(results, question)
                print(f"\n{response}\n")
                
            except KeyboardInterrupt:
                print("\n\n🐶 Goodbye! Thanks for using the Database Agent!")
                break
            except Exception as e:
                print(f"\n🚫 Oops! Something went wrong: {e}\n")

def main():
    """Main function to run the agent"""
    agent = DatabaseAgent()
    
    if not agent.data:
        print("\n🚫 No data loaded. Please make sure database.txt exists!")
        return
    
    # Check if running with command line arguments
    if len(sys.argv) > 1:
        question = ' '.join(sys.argv[1:])
        results = agent.process_question(question)
        response = agent.format_response(results, question)
        print(response)
    else:
        agent.chat()

if __name__ == "__main__":
    main()