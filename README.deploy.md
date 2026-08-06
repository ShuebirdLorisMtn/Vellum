### Additional deployment notes

This branch serves the frontend static files from /public. If you deploy the backend to Render (or similar) the static files will be served by the same service. Alternatively you may host the static site separately on Cloudflare Pages and point it to the backend.

New environment variable
- WHOP_PRODUCT_URL - the public URL of your Whop product (the purchase page). If this is not set, the frontend will fetch /config to discover a value (server exposes the env value if present).

