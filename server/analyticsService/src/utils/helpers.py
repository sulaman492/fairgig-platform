from datetime import datetime

"""
Helper Functions - Reusable utilities
Similar to: export const safeFloat = (value) => { ... }
"""

def safe_float(value) -> float:
    """Convert value to float safely - like parseFloat() with fallback"""
    if value is None:
        return 0.0
    return round(float(value), 2)

def week_label(value) -> str:
    """Convert date to week label - like formatDate(date, 'DD MMM')"""
    if isinstance(value, str):
        dt = datetime.fromisoformat(value)
    else:
        dt = value
    return dt.strftime("%d %b")

def build_cluster_metadata(complaint: dict) -> dict:
    """Build cluster metadata for complaint - like clustering logic"""
    import re
    import zlib
    from collections import Counter
    
    STOP_WORDS = {"about", "after", "again", "been", "being", "careem", 
                  "could", "delivery", "foodpanda", "from", "have", 
                  "more", "over", "platform", "ride", "rides", "shift",
                  "that", "their", "there", "these", "they", "this", 
                  "uber", "when", "with", "worker", "workers", "your"}
    
    source = " ".join(filter(None, [
        complaint.get("platform"),
        complaint.get("category"),
        complaint.get("title"),
        complaint.get("description"),
    ])).lower()

    words = re.findall(r"[a-zA-Z]{4,}", source)
    filtered = [word for word in words if word not in STOP_WORDS]
    common_words = [word for word, _count in Counter(filtered).most_common(2)]
    keyword_part = "-".join(common_words) if common_words else "general"

    platform = (complaint.get("platform") or "unknown").lower().replace(" ", "-")
    category = (complaint.get("category") or "general").lower().replace(" ", "-")
    cluster_key = f"{platform}:{category}:{keyword_part}"
    cluster_id = zlib.crc32(cluster_key.encode("utf-8")) % 1000000

    suggested_tags = []
    for tag in [complaint.get("platform"), complaint.get("category"), *common_words]:
        if tag:
            normalized = str(tag).strip().lower().replace(" ", "-")
            if normalized and normalized not in suggested_tags:
                suggested_tags.append(normalized)

    label_keywords = ", ".join(common_words) if common_words else "general pattern"

    return {
        "cluster_key": cluster_key,
        "cluster_id": cluster_id,
        "cluster_label": f"{complaint.get('platform', 'Platform')} / {complaint.get('category', 'General')}",
        "cluster_reason": f"Grouped around {label_keywords}",
        "suggested_tags": suggested_tags[:5],
    }