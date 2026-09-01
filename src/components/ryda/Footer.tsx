"use client";

import { Github, ExternalLink, MapPin, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Footer() {
  return (
    <footer
      role="contentinfo"
      className="mt-auto border-t border-ryda-border bg-ryda-bg"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr] gap-10 md:gap-16">
          {/* Brand column */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xl font-extrabold tracking-tight text-ryda-text">
                RYDA
              </span>
              <span
                aria-hidden="true"
                className="size-2 rounded-full"
                style={{
                  background:
                    "linear-gradient(135deg, var(--ryda-primary) 0%, var(--ryda-pink) 100%)",
                  boxShadow: "0 0 10px rgba(255, 87, 34, 0.5)",
                }}
              />
              <span
                className="text-xs font-mono px-1.5 py-0.5 rounded-md"
                style={{
                  background: "linear-gradient(135deg, var(--ryda-primary-soft) 0%, #FCE7F3 100%)",
                  color: "var(--ryda-primary)",
                  border: "1px solid color-mix(in oklab, var(--ryda-primary) 30%, transparent)",
                }}
              >
                v2
              </span>
            </div>
            <p className="text-sm text-ryda-muted leading-relaxed max-w-md">
              Production-grade ride-hailing platform for Bhopal — light,
              vibrant, and alive. Built as a freelance portfolio piece: a
              full rewrite of an existing MVP into a typed, tested,
              deployable system on a 100% free stack.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <Button
                size="sm"
                asChild
                className="ryda-btn-gradient font-semibold border-0"
              >
                <a
                  href="https://github.com/ryda-v2"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Github className="size-3.5" aria-hidden="true" />
                  Get the code
                  <ExternalLink className="size-3 opacity-70" aria-hidden="true" />
                </a>
              </Button>
              <Button
                size="sm"
                variant="ghost"
                asChild
                className="text-ryda-muted hover:text-ryda-text hover:bg-ryda-bg-soft"
              >
                <a href="#bhopal">
                  <MapPin className="size-3.5 text-ryda-primary" aria-hidden="true" />
                  Live demo
                </a>
              </Button>
              <Button
                size="sm"
                variant="ghost"
                asChild
                className="text-ryda-muted hover:text-ryda-text hover:bg-ryda-bg-soft"
              >
                <a
                  href="/download/RYDA-V2-IMPLEMENTATION-PLAN.md"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Sparkles className="size-3.5 text-ryda-accent" aria-hidden="true" />
                  Implementation plan
                </a>
              </Button>
            </div>
          </div>

          {/* Attribution column */}
          <div className="flex flex-col gap-3 text-xs text-ryda-muted leading-relaxed">
            <h3 className="text-ryda-text font-semibold text-sm mb-1">
              Attribution
            </h3>
            <p>
              Bhopal boundary data ©{" "}
              <a
                href="https://www.openstreetmap.org/copyright"
                target="_blank"
                rel="noopener noreferrer"
                className="text-ryda-primary hover:underline underline-offset-2 font-medium"
              >
                OpenStreetMap contributors
              </a>{" "}
              (ODbL). Source: OSM relation 1976080, simplified to 465 vertices.
            </p>
            <p>
              Demo mode uses mock data — no real payments, no real rides, no
              API keys required. Driver markers, ETAs, and surge multipliers
              shown here are simulated telemetry for portfolio purposes.
            </p>
            <p className="pt-3 border-t border-ryda-border mt-2 text-ryda-muted/70">
              © {new Date().getFullYear()} Ryda v2. Built with Next.js 16,
              Postgres + PostGIS, Socket.IO + Redis, MapLibre + OSM, Razorpay.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
