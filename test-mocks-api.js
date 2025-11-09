// Test script to fetch mocks from the API
// Run with: node test-mocks-api.js

const fetch = require("node-fetch")

async function testMocksAPI() {
  try {
    console.log("Testing GET /api/mocks...\n")

    // You'll need to provide a valid session cookie
    // For testing, you can get this from your browser after logging in
    const response = await fetch("http://localhost:3000/api/mocks", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        // Add your session cookie here if needed
        // 'Cookie': 'sb-access-token=your-token-here'
      },
    })

    console.log("Status:", response.status)
    console.log("Status Text:", response.statusText)

    const data = await response.json()
    console.log("\nResponse:", JSON.stringify(data, null, 2))

    if (response.ok) {
      console.log("\n✅ Success!")
      console.log(`Found ${data.mocks?.length || 0} mocks`)
    } else {
      console.log("\n❌ Error:", data.error || "Unknown error")
    }
  } catch (error) {
    console.error("❌ Request failed:", error.message)
  }
}

testMocksAPI()
