import type { Metadata } from "next";
import { PublicProfileClient } from "@/components/templates/PublicProfileClient";
import { RESERVED_SLUGS, getProfileBySlug } from "@/lib/storage";

interface PublicProfilePageProps {
  params: { slug: string };
}

function cleanSlug(slug: string): string {
  return slug.toLowerCase().trim();
}

async function getPublicProfile(slug: string) {
  const targetSlug = cleanSlug(slug);
  if (!targetSlug || RESERVED_SLUGS.includes(targetSlug)) return null;

  const profile = await getProfileBySlug(targetSlug);
  return profile?.status === "published" ? profile : null;
}

export async function generateMetadata({ params }: PublicProfilePageProps): Promise<Metadata> {
  const profile = await getPublicProfile(params.slug);
  if (!profile) {
    return { title: "Profile Not Found | Tap-Maker" };
  }

  const title = `${profile.name} — Official Links`;
  const description = profile.bio || profile.subtitle || `Connect with ${profile.name}.`;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "profile",
      images: profile.avatarUrl ? [{ url: profile.avatarUrl }] : undefined,
    },
    twitter: {
      card: profile.avatarUrl ? "summary_large_image" : "summary",
      title,
      description,
      images: profile.avatarUrl ? [profile.avatarUrl] : undefined,
    },
  };
}

export default async function PublicProfilePage({ params }: PublicProfilePageProps) {
  const slug = cleanSlug(params.slug);
  const profile = await getPublicProfile(slug);
  return <PublicProfileClient profile={profile} slug={slug} />;
}
