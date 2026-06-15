import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { SiteLayout } from "@/components/site/Layout";
import { getPostBySlug } from "@/lib/catalog.functions";
import ReactMarkdown from "react-markdown";

const q = (slug: string) => queryOptions({ queryKey: ["post", slug], queryFn: () => getPostBySlug({ data: { slug } }) });

export const Route = createFileRoute("/resources/$slug")({
  loader: async ({ context, params }) => {
    const post = await context.queryClient.ensureQueryData(q(params.slug));
    if (!post) throw notFound();
    return post;
  },
  head: ({ loaderData, params }) => ({
    meta: [
      { title: `${loaderData?.title ?? "Article"} | Alfa Tooling Resources` },
      { name: "description", content: loaderData?.excerpt ?? "" },
      { property: "og:title", content: loaderData?.title ?? "" },
      { property: "og:description", content: loaderData?.excerpt ?? "" },
      { property: "og:type", content: "article" },
      { property: "og:url", content: `/resources/${params.slug}` },
    ],
    links: [{ rel: "canonical", href: `/resources/${params.slug}` }],
  }),
  component: PostPage,
});

function PostPage() {
  const params = Route.useParams();
  const { data: post } = useSuspenseQuery(q(params.slug));
  if (!post) return null;
  return (
    <SiteLayout>
      <article className="container mx-auto px-4 py-12 max-w-3xl">
        <Link to="/resources" className="text-xs uppercase tracking-wider text-orange font-semibold">← All Resources</Link>
        <h1 className="mt-3 font-display text-3xl md:text-4xl font-bold text-navy">{post.title}</h1>
        {post.excerpt && <p className="mt-3 text-lg text-muted-foreground">{post.excerpt}</p>}
        <div className="prose prose-sm md:prose-base mt-8 max-w-none">
          <ReactMarkdown>{post.body_md}</ReactMarkdown>
        </div>
      </article>
    </SiteLayout>
  );
}
