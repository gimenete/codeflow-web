import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { badgeVariants } from "@/components/ui/badge";

const REPO = "gimenete/codeflow";
const API_URL = `https://api.github.com/repos/${REPO}/releases/latest`;

interface ReleaseAsset {
  name: string;
  browser_download_url: string;
  size: number;
}

interface Release {
  tag_name: string;
  name: string;
  html_url: string;
  published_at: string;
  assets: ReleaseAsset[];
  body: string;
}

type Platform = {
  name: string;
  icon: React.ReactNode;
  match: (name: string) => boolean;
};

const platforms: Platform[] = [
  {
    name: "macOS",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />
      </svg>
    ),
    match: (name: string) => {
      const lower = name.toLowerCase();
      return lower.includes("mac") || lower.includes("darwin") || lower.includes("macos") || lower.endsWith(".dmg");
    },
  },
  {
    name: "Windows",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.125m-10.5 0H3m7.5 0h3m-3 0v7.5m0-7.5h6.375c.621 0 1.125.504 1.125 1.125V21m-7.5-12.75v12.75m0 0H4.125C3.504 21 3 20.496 3 19.875V8.25m7.5 12.75h6.375c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H10.5" />
      </svg>
    ),
    match: (name: string) => {
      const lower = name.toLowerCase();
      return lower.includes("win") || lower.endsWith(".exe") || lower.endsWith(".msi");
    },
  },
  {
    name: "Linux",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 14.25h13.5m-13.5 0a3 3 0 01-3-3m3 3a3 3 0 100 6h13.5a3 3 0 100-6m-16.5-3a3 3 0 013-3h13.5a3 3 0 013 3m-19.5 0a4.5 4.5 0 01.9-2.7L5.737 5.1a3.375 3.375 0 012.7-1.35h7.126c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 01.9 2.7m0 0h.375a2.625 2.625 0 010 5.25H17.25" />
      </svg>
    ),
    match: (name: string) => {
      const lower = name.toLowerCase();
      return lower.includes("linux") || lower.endsWith(".appimage") || lower.endsWith(".deb") || lower.endsWith(".rpm");
    },
  },
];

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function isInstallerAsset(name: string): boolean {
  const lower = name.toLowerCase();
  return !(lower.endsWith(".sha256") || lower.endsWith(".sig") || lower.endsWith(".blockmap") || lower.endsWith(".yaml") || lower.endsWith(".yml"));
}

export default function DownloadLinks() {
  const [release, setRelease] = useState<Release | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(API_URL)
      .then((res) => {
        if (res.status === 404) {
          setLoading(false);
          return null;
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (data) setRelease(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Could not fetch release information. Please try again later.");
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-4 text-muted-foreground">
        <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        Checking for latest release&hellip;
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-destructive">{error}</p>;
  }

  if (!release) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">
          No releases available yet. Check back soon!
        </p>
        <a
          href={`https://github.com/${REPO}/releases`}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(buttonVariants({ variant: "outline", size: "lg" }), "gap-2")}
        >
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
          </svg>
          Watch on GitHub
        </a>
      </div>
    );
  }

  // Match assets to platforms
  const installerAssets = release.assets.filter((a) => isInstallerAsset(a.name));
  const platformAssets = platforms.map((platform) => {
    const asset = installerAssets.find((a) => platform.match(a.name));
    return { platform, asset };
  });
  const unmatchedAssets = installerAssets.filter(
    (a) => !platforms.some((p) => p.match(a.name))
  );

  return (
    <div className="space-y-6">
      {/* Version badge */}
      <div className="flex items-center justify-center gap-2">
        <a
          href={release.html_url}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(badgeVariants({ variant: "secondary" }), "gap-1.5 px-3 py-1 text-sm")}
        >
          {release.name || release.tag_name}
        </a>
      </div>

      {/* Platform download buttons */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {platformAssets.map(({ platform, asset }) => (
          <a
            key={platform.name}
            href={asset?.browser_download_url ?? `https://github.com/${REPO}/releases/latest`}
            target={asset ? undefined : "_blank"}
            rel={asset ? undefined : "noopener noreferrer"}
            className={cn(
              buttonVariants({ variant: asset ? "default" : "outline", size: "lg" }),
              "flex flex-col gap-1 h-auto py-3"
            )}
          >
            <span className="flex items-center gap-2">
              {platform.icon}
              {platform.name}
            </span>
            {asset && (
              <span className="text-xs opacity-70">
                {asset.name} ({formatBytes(asset.size)})
              </span>
            )}
            {!asset && (
              <span className="text-xs opacity-70">Not available yet</span>
            )}
          </a>
        ))}
      </div>

      {/* Additional assets */}
      {unmatchedAssets.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Other downloads:</p>
          <div className="flex flex-wrap justify-center gap-2">
            {unmatchedAssets.map((asset) => (
              <a
                key={asset.name}
                href={asset.browser_download_url}
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "gap-1.5 text-xs"
                )}
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                {asset.name} ({formatBytes(asset.size)})
              </a>
            ))}
          </div>
        </div>
      )}

      {/* All releases link */}
      <p className="text-sm text-muted-foreground">
        <a
          href={`https://github.com/${REPO}/releases`}
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-4 hover:text-foreground"
        >
          View all releases on GitHub
        </a>
      </p>
    </div>
  );
}
