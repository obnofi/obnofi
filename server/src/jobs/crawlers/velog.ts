import axios from "axios";

const VELOG_GQL = "https://api.velog.io/graphql";

interface VelogPost {
  id: string;
  title: string;
  short_description: string;
  thumbnail: string | null;
  url_slug: string;
  released_at: string;
  user: { username: string };
}

export async function fetchVelogPosts(username: string): Promise<VelogPost[]> {
  const { data } = await axios.post(VELOG_GQL, {
    query: `
      query Posts($username: String!) {
        posts(username: $username) {
          id title short_description thumbnail url_slug released_at
          user { username }
        }
      }
    `,
    variables: { username },
  });
  return data.data?.posts ?? [];
}
