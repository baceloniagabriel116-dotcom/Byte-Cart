// Dynamic site customization: footer settings + team members.
// Backed by Supabase (site_settings + team_members tables) with a
// localStorage cache so the public pages still render offline.
class SiteSettingsManager {
  constructor() {
    this.cacheKey = "site-settings-cache";
    this.teamKey = "team-members-cache";
    this.defaults = {
      brand_name: "ByteCart",
      copyright_text: "© 2026 ByteCart. All rights reserved.",
      social_links: [
        { label: "Facebook", url: "https://facebook.com" },
        { label: "X", url: "https://x.com" },
        { label: "Instagram", url: "https://instagram.com" }
      ]
    };
  }

  // ---------- Settings ----------
  getCachedSettings() {
    try { return JSON.parse(localStorage.getItem(this.cacheKey)) || null; } catch { return null; }
  }

  getSettings() {
    return { ...this.defaults, ...(this.getCachedSettings() || {}) };
  }

  async loadSettings() {
    if (!isSupabaseConfigured) return this.getSettings();
    const { data, error } = await supabaseClient.from("site_settings").select("*");
    if (error) { console.warn("site_settings load failed:", error.message); return this.getSettings(); }
    const settings = { ...this.defaults };
    (data || []).forEach(row => {
      if (row.key === "social_links") {
        try { settings.social_links = JSON.parse(row.value); } catch { /* keep default */ }
      } else {
        settings[row.key] = row.value;
      }
    });
    localStorage.setItem(this.cacheKey, JSON.stringify(settings));
    return settings;
  }

  async saveSetting(key, value) {
    // Update local cache immediately so the UI reflects the change instantly.
    const settings = this.getSettings();
    settings[key] = value;
    localStorage.setItem(this.cacheKey, JSON.stringify(settings));
    if (!isSupabaseConfigured) return { success: true, offline: true };
    const { error } = await supabaseClient
      .from("site_settings")
      .upsert({ key, value: typeof value === "string" ? value : JSON.stringify(value), updated_at: new Date().toISOString() }, { onConflict: "key" });
    if (error) return { success: false, error: error.message };
    return { success: true };
  }

  async saveSettings(patch) {
    const results = [];
    for (const [key, value] of Object.entries(patch)) results.push(await this.saveSetting(key, value));
    return results.every(r => r.success) ? { success: true } : { success: false, error: results.find(r => r.error)?.error };
  }

  // ---------- Team ----------
  getCachedTeam() {
    try { return JSON.parse(localStorage.getItem(this.teamKey)) || []; } catch { return []; }
  }

  async loadTeam() {
    if (!isSupabaseConfigured) return this.getCachedTeam();
    const { data, error } = await supabaseClient.from("team_members").select("*").order("sort_order", { ascending: true });
    if (error) { console.warn("team_members load failed:", error.message); return this.getCachedTeam(); }
    const team = data || [];
    localStorage.setItem(this.teamKey, JSON.stringify(team));
    return team;
  }

  async saveTeamMember(member) {
    if (!isSupabaseConfigured) return { success: false, error: "Supabase is not configured." };
    const payload = {
      id: member.id,
      name: member.name,
      role: member.role || "",
      bio: member.bio || "",
      image_url: member.image_url || "",
      sort_order: member.sort_order || 0,
      created_at: member.created_at || new Date().toISOString()
    };
    const { error } = await supabaseClient.from("team_members").upsert(payload);
    if (error) return { success: false, error: error.message };
    return { success: true };
  }

  async deleteTeamMember(id) {
    if (!isSupabaseConfigured) return { success: false, error: "Supabase is not configured." };
    const { error } = await supabaseClient.from("team_members").delete().eq("id", id);
    if (error) return { success: false, error: error.message };
    return { success: true };
  }

  // ---------- Rendering ----------
  renderFooter() {
    const copyrightEl = document.getElementById("footerCopyright");
    if (copyrightEl) copyrightEl.textContent = this.getSettings().copyright_text;
    const socialEl = document.getElementById("footerSocial");
    if (socialEl) {
      socialEl.innerHTML = (this.getSettings().social_links || []).map(link =>
        `<a href="${link.url}" target="_blank" rel="noopener" aria-label="${link.label}">${link.label}</a>`
      ).join("");
    }
  }

  async renderTeam(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const team = await this.loadTeam();
    if (!team.length) {
      container.innerHTML = '<p style="color:#6b7280; text-align:center;">Our team section is coming soon.</p>';
      return;
    }
    container.innerHTML = team.map(member => `
      <div class="team-card">
        <img class="team-photo" src="${member.image_url || 'assets/default-tech-placeholder.svg'}" alt="Portrait of ${member.name}">
        <h3>${member.name}</h3>
        <p class="team-role">${member.role}</p>
        <p class="team-bio">${member.bio}</p>
      </div>
    `).join("");
  }
}

const siteSettings = new SiteSettingsManager();
