// Coded by Awnish - Instagram Profile Info API
addEventListener("fetch", event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  const username = url.searchParams.get("username");

  // Check if username is provided
  if (!username) {
    return jsonResponse({ error: "missing_username", usage: "/info?username=<name>" }, 400);
  }

  try {
    // Fetch data from Instagram's unofficial API
    const response = await fetch(`https://i.instagram.com/api/v1/users/web_profile_info/?username=${username}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "x-ig-app-id": "936619743392459",
        "Accept": "application/json",
        "Referer": `https://www.instagram.com/${username}/`
      }
    });

    // Handle specific errors
    if (response.status === 404) {
      return jsonResponse({ error: "user_not_found" }, 404);
    }
    if (!response.ok) {
      return jsonResponse({ error: "instagram_api_error", status: response.status }, 400);
    }

    const data = await response.json();
    const userData = data?.data?.user;

    // If no user data, return raw response for debugging
    if (!userData) {
      return jsonResponse({ error: "invalid_response", raw: data }, 500);
    }

    // Extract recent posts (up to 8)
    const mediaEdges = userData.edge_owner_to_timeline_media?.edges || [];
    const recentPosts = mediaEdges.slice(0, 8).map(edge => {
      const node = edge.node || edge;
      return {
        id: node.id,
        code: node.shortcode,
        image: node.display_url,
        caption: node.edge_media_to_caption?.edges?.[0]?.node?.text || null
      };
    });

    // Build and return user profile data
    const profile = {
      id: userData.id,
      username: userData.username,
      full_name: userData.full_name,
      bio: userData.biography,
      is_verified: userData.is_verified,
      is_private: userData.is_private,
      profile_pic: userData.profile_pic_url_hd || userData.profile_pic_url,
      followers: userData.edge_followed_by?.count || 0,
      following: userData.edge_follow?.count || 0,
      posts_count: userData.edge_owner_to_timeline_media?.count || 0,
      recent_posts: recentPosts
    };

    return jsonResponse(profile);
  } catch (error) {
    return jsonResponse({ error: "server_error", message: error.message }, 500);
  }
}

// Helper function for JSON responses
function jsonResponse(object, status = 200) {
  return new Response(JSON.stringify(object, null, 2), {
    status: status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"  // CORS allow for easy testing
    }
  });
}
