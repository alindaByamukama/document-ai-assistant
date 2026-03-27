"""
LangChain + OpenAI Handler for document analysis
Uses LangChain for chains and OpenAI for LLM
"""

import os
import json
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain

load_dotenv()


class LLMHandler:
    """
    Handles document analysis using LangChain + OpenAI.
    
    Configuration via .env:
    - OPENAI_API_KEY: Your OpenAI API key
    """
    
    def __init__(self):
        api_key = os.getenv("OPENAI_API_KEY")
        print(f"DEBUG: API key starts with: {api_key[:20] if api_key else 'NOT FOUND'}")
        if not api_key:
            raise ValueError(
                "OPENAI_API_KEY not set in .env\n"
                "Get one at: https://platform.openai.com/api-keys"
            )
        
        # Initialize OpenAI LLM
        self.llm = ChatOpenAI(
            api_key=api_key,
            model="gpt-3.5-turbo",
            temperature=0.3,  # Lower = more consistent
            max_tokens=500
        )
        
        # Define the analysis prompt
        self.prompt_template = PromptTemplate(
            input_variables=["document_text"],
            template="""Analyze this document and provide structured analysis.

        Respond ONLY with valid JSON (no markdown, no extra text, no preamble).

        Document:
        {document_text}

        Instructions:
        - For title: Look for the first heading, main heading, or title text at the beginning. If none found, use 'Unknown'
        - For author: Look for author name, byline, or author field. If none found, use 'Unknown'
        - For summary: 2-3 sentences capturing the main idea
        - For topics: Extract 3-4 main topics/themes from the document

        Return this exact JSON structure:
        {{
            "summary": "2-3 sentence summary of the document",
            "title": "Document title or first heading if identifiable, otherwise 'Unknown'",
            "author": "Document author if identifiable, otherwise 'Unknown'",
            "main_topics": ["topic1", "topic2", "topic3", "topic4"]
        }}

        JSON Response:"""
        )
        
        self.chain = LLMChain(llm=self.llm, prompt=self.prompt_template)
    
    async def analyze(self, text: str) -> dict:
        """
        Analyze document text and return structured analysis.
        
        Returns:
        {
            "summary": "...",
            "title": "...",
            "author": "...",
            "main_topics": ["topic1", "topic2"]
        }
        """
        
        try:
            response = self.chain.run(document_text=text)
            # Clean response to extract JSON
            clean_response = response.strip()
            if clean_response.startswith("```"):
                clean_response = clean_response.split("```")[1]
                if clean_response.startswith("json"):
                    clean_response = clean_response[4:]
            
            # Parse JSON
            result = json.loads(clean_response)
            
            # Validate structure
            required_keys = {"summary", "title", "author", "main_topics"}
            if not required_keys.issubset(result.keys()):
                raise ValueError(f"Missing keys. Got: {result.keys()}, Need: {required_keys}")
            
            return result
        
        except json.JSONDecodeError as e:
            # Fallback if JSON parsing fails
            return {
                "summary": text[:200],
                "title": "Analysis Failed",
                "author": "Unknown",
                "main_topics": ["JSON parse error: response was not valid JSON"]
            }
        except Exception as e:
            raise RuntimeError(f"OpenAI analysis error: {str(e)}")
