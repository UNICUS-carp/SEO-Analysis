#!/usr/bin/env python3
"""
MCP-based Web Scraping Server for Clinic Websites
Following best practices: MCP SDK + Headless Browser + XPath extraction
"""

import asyncio
import json
import os
import time
from typing import Any, Dict, List
from pathlib import Path

# MCP Framework
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Tool, TextContent

# Web Scraping
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager

# HTML Parsing
from lxml import html as lxml_html
import lxml.etree as etree

# Configuration
CLINIC_SITES = [
    {'name': 'mori18', 'url': 'https://mori18.com/'},
    {'name': 'fujii-hone', 'url': 'https://fujii-hone.com/'},
    {'name': 'sakatsume-bsac', 'url': 'https://sakatsume-bsac.com/'}
]

OUTPUT_DIR = Path('./clinic-analysis-mcp')

class ClinicScraperMCP:
    """MCP Server for Clinic Website Scraping"""

    def __init__(self):
        self.server = Server("clinic-scraper")
        self.driver = None

        # Register tools
        self.setup_tools()

    def setup_tools(self):
        """Register MCP tools for scraping"""

        @self.server.list_tools()
        async def list_tools() -> List[Tool]:
            return [
                Tool(
                    name="fetch_page",
                    description="Fetch a webpage using headless browser with JavaScript execution support",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "url": {"type": "string", "description": "URL to fetch"},
                            "wait_time": {"type": "number", "description": "Time to wait for JavaScript (seconds)", "default": 3}
                        },
                        "required": ["url"]
                    }
                ),
                Tool(
                    name="extract_info",
                    description="Extract structured information from HTML using XPath",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "html_content": {"type": "string", "description": "HTML content to parse"},
                            "extraction_rules": {"type": "object", "description": "XPath rules for extraction"}
                        },
                        "required": ["html_content", "extraction_rules"]
                    }
                ),
                Tool(
                    name="scrape_clinic",
                    description="Complete scraping workflow for a clinic website",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "site_name": {"type": "string", "description": "Clinic site name (mori18, fujii-hone, sakatsume-bsac)"}
                        },
                        "required": ["site_name"]
                    }
                )
            ]

        @self.server.call_tool()
        async def call_tool(name: str, arguments: Any) -> List[TextContent]:
            """Handle tool calls"""

            if name == "fetch_page":
                result = await self.fetch_page(
                    arguments.get("url"),
                    arguments.get("wait_time", 3)
                )
                return [TextContent(type="text", text=json.dumps(result, ensure_ascii=False, indent=2))]

            elif name == "extract_info":
                result = self.extract_info(
                    arguments.get("html_content"),
                    arguments.get("extraction_rules")
                )
                return [TextContent(type="text", text=json.dumps(result, ensure_ascii=False, indent=2))]

            elif name == "scrape_clinic":
                result = await self.scrape_clinic(arguments.get("site_name"))
                return [TextContent(type="text", text=json.dumps(result, ensure_ascii=False, indent=2))]

            else:
                raise ValueError(f"Unknown tool: {name}")

    def init_driver(self):
        """Initialize headless Chrome driver"""
        try:
            print("🚀 Initializing headless Chrome...")

            chrome_options = Options()
            chrome_options.add_argument('--headless')
            chrome_options.add_argument('--no-sandbox')
            chrome_options.add_argument('--disable-dev-shm-usage')
            chrome_options.add_argument('--disable-gpu')
            chrome_options.add_argument('--window-size=1920,1080')
            chrome_options.add_argument('--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')

            # Use webdriver-manager for automatic driver management
            service = Service(ChromeDriverManager().install())
            self.driver = webdriver.Chrome(service=service, options=chrome_options)

            print("✅ Chrome driver initialized")
            return True

        except Exception as e:
            print(f"❌ Failed to initialize driver: {e}")
            return False

    async def fetch_page(self, url: str, wait_time: float = 3) -> Dict[str, Any]:
        """
        Fetch page with headless browser

        Best practices:
        1. Wait for DOM load
        2. Additional wait for JavaScript rendering
        3. Robust error handling
        """
        try:
            if not self.driver:
                if not self.init_driver():
                    return {"success": False, "error": "Failed to initialize driver"}

            print(f"🌐 Fetching: {url}")

            # Navigate to page
            self.driver.get(url)

            # Wait for body element (DOM ready)
            WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.TAG_NAME, "body"))
            )

            # Additional wait for JavaScript rendering
            time.sleep(wait_time)

            # Get page source
            html_content = self.driver.page_source

            # Get page title
            title = self.driver.title

            # Save to file
            OUTPUT_DIR.mkdir(exist_ok=True)
            filename = OUTPUT_DIR / f"{url.replace('https://', '').replace('/', '_')}.html"
            with open(filename, 'w', encoding='utf-8') as f:
                f.write(html_content)

            print(f"✅ Fetched {len(html_content)} bytes")
            print(f"📄 Title: {title}")
            print(f"💾 Saved to: {filename}")

            return {
                "success": True,
                "url": url,
                "title": title,
                "html_size": len(html_content),
                "html_content": html_content,
                "saved_to": str(filename)
            }

        except Exception as e:
            print(f"❌ Error fetching {url}: {e}")
            return {
                "success": False,
                "url": url,
                "error": str(e)
            }

    def extract_info(self, html_content: str, extraction_rules: Dict[str, str]) -> Dict[str, Any]:
        """
        Extract information using XPath

        Best practices:
        1. Use robust XPath expressions
        2. Handle missing elements gracefully
        3. Normalize extracted data
        """
        try:
            # Parse HTML with lxml
            tree = lxml_html.fromstring(html_content)

            results = {}

            for field_name, xpath_expr in extraction_rules.items():
                try:
                    elements = tree.xpath(xpath_expr)

                    # Extract text content
                    if elements:
                        if isinstance(elements[0], str):
                            results[field_name] = elements
                        else:
                            results[field_name] = [elem.text_content().strip() for elem in elements if elem.text_content().strip()]
                    else:
                        results[field_name] = []

                except Exception as e:
                    results[field_name] = {"error": str(e)}

            return {
                "success": True,
                "extracted_data": results
            }

        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

    async def scrape_clinic(self, site_name: str) -> Dict[str, Any]:
        """
        Complete scraping workflow for a clinic site

        Workflow:
        1. Fetch page with headless browser
        2. Extract clinic-specific information
        3. Save structured data
        """
        try:
            # Find site config
            site_config = next((s for s in CLINIC_SITES if s['name'] == site_name), None)
            if not site_config:
                return {"success": False, "error": f"Unknown site: {site_name}"}

            print(f"\n{'='*60}")
            print(f"🏥 Scraping Clinic: {site_name}")
            print(f"🔗 URL: {site_config['url']}")
            print('='*60)

            # Step 1: Fetch page
            fetch_result = await self.fetch_page(site_config['url'])
            if not fetch_result.get('success'):
                return fetch_result

            html_content = fetch_result['html_content']

            # Step 2: Define extraction rules (XPath)
            extraction_rules = {
                "phone_links": "//a[starts-with(@href, 'tel:')]/@href",
                "phone_texts": "//a[starts-with(@href, 'tel:')]/text()",
                "line_links": "//a[contains(@href, 'line.me') or contains(@href, 'line://')]/@href",
                "form_actions": "//form/@action",
                "button_texts": "//button/text() | //input[@type='submit']/@value",
                "reservation_elements": "//*[contains(@class, 'reserv') or contains(@class, '予約')]/text()",
                "price_elements": "//*[contains(@class, 'price') or contains(@class, '料金')]/text()",
                "h1_headings": "//h1/text()",
                "h2_headings": "//h2/text()",
                "nav_links": "//nav//a/text()",
                "title": "//title/text()"
            }

            # Step 3: Extract information
            print("🔍 Extracting information with XPath...")
            extraction_result = self.extract_info(html_content, extraction_rules)

            if not extraction_result.get('success'):
                return extraction_result

            extracted_data = extraction_result['extracted_data']

            # Step 4: Build summary
            summary = {
                "site": site_name,
                "url": site_config['url'],
                "title": extracted_data.get('title', [''])[0] if extracted_data.get('title') else '',
                "stats": {
                    "phone_links": len(extracted_data.get('phone_links', [])),
                    "line_links": len(extracted_data.get('line_links', [])),
                    "forms": len(extracted_data.get('form_actions', [])),
                    "buttons": len(extracted_data.get('button_texts', [])),
                    "reservation_elements": len(extracted_data.get('reservation_elements', [])),
                    "price_elements": len(extracted_data.get('price_elements', [])),
                    "nav_links": len(extracted_data.get('nav_links', []))
                },
                "extracted_data": extracted_data
            }

            # Step 5: Save results
            output_file = OUTPUT_DIR / f"{site_name}-analysis.json"
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(summary, f, ensure_ascii=False, indent=2)

            print(f"\n📊 Results:")
            print(f"   📞 Phone Links: {summary['stats']['phone_links']}")
            print(f"   💚 LINE Links: {summary['stats']['line_links']}")
            print(f"   📝 Forms: {summary['stats']['forms']}")
            print(f"   🔘 Buttons: {summary['stats']['buttons']}")
            print(f"   📅 Reservation: {summary['stats']['reservation_elements']}")
            print(f"   💰 Price: {summary['stats']['price_elements']}")
            print(f"\n💾 Saved to: {output_file}")
            print('='*60 + '\n')

            return {
                "success": True,
                "summary": summary,
                "saved_to": str(output_file)
            }

        except Exception as e:
            print(f"❌ Error: {e}")
            import traceback
            traceback.print_exc()
            return {
                "success": False,
                "site": site_name,
                "error": str(e)
            }

    def cleanup(self):
        """Cleanup resources"""
        if self.driver:
            self.driver.quit()
            print("🧹 Driver cleaned up")

async def main():
    """Main entry point for MCP server"""
    scraper = ClinicScraperMCP()

    # Run MCP server
    async with stdio_server() as (read_stream, write_stream):
        await scraper.server.run(
            read_stream,
            write_stream,
            scraper.server.create_initialization_options()
        )

async def test_scraping():
    """Test scraping functionality directly (without MCP protocol)"""
    scraper = ClinicScraperMCP()

    print("\n🏥 Starting Clinic Scraping Test")
    print("="*60)

    results = []

    for site_config in CLINIC_SITES:
        result = await scraper.scrape_clinic(site_config['name'])
        results.append(result)

        # Wait between requests
        if site_config != CLINIC_SITES[-1]:
            print("⏳ Waiting 3 seconds...")
            await asyncio.sleep(3)

    # Save summary
    summary_file = OUTPUT_DIR / "all-sites-summary.json"
    with open(summary_file, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    print("\n" + "="*60)
    print("🎉 SCRAPING COMPLETE")
    print("="*60)

    for result in results:
        if result.get('success'):
            summary = result['summary']
            print(f"\n✅ {summary['site']} - {summary['title']}")
            print(f"   📞 {summary['stats']['phone_links']} | 💚 {summary['stats']['line_links']} | 📝 {summary['stats']['forms']}")
        else:
            print(f"\n❌ {result.get('site', 'Unknown')}: {result.get('error')}")

    print(f"\n📁 Results: {OUTPUT_DIR}/\n")

    scraper.cleanup()

if __name__ == "__main__":
    import sys

    if "--test" in sys.argv:
        # Run in test mode (direct scraping without MCP protocol)
        asyncio.run(test_scraping())
    else:
        # Run as MCP server
        asyncio.run(main())
