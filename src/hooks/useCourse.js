// src/pages/dashboard/hooks/useCourse.js
import { useEffect, useMemo, useState } from "react";
import StudentProgramsService from "../services/student/programsService";
import { BASE_URL, joinUrl, toArray, ensureArray } from "../utils";
import { processProgram } from "../utils/translations";

export default function useCourse(progId) {
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState(null);
  const [reviewsSummary, setReviewsSummary] = useState({
    total: 0,
    average: 0,
    stars: {},
  });
  const [currentSessionId, setCurrentSessionId] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        if (!progId) return setCourse(null);

        const res = await StudentProgramsService.getOne(progId);
        const data = res?.data?.data || {};

        // Process the program data with translations
        const processedData = processProgram(data);

        // Handle sessions - they might be at root level or inside sections
        const rootSessions = data.sessions || [];
        const sectionsArray = data.sections || [];
        
        // Debug: Log the structure
        console.log('API Data:', {
          sections: sectionsArray.length,
          rootSessions: rootSessions.length,
          firstSection: sectionsArray[0],
          firstRootSession: rootSessions[0],
          rootSessionsWithSectionId: rootSessions.filter(s => s.section_id).length
        });
        
        setCourse({
          ...processedData,
          image: joinUrl(BASE_URL, data.image),
          sections: sectionsArray.map((sec, secIndex) => {
            // Get sessions from section first, then from root level by section_id
            let sectionSessions = sec.sessions || [];
            
            // If no sessions in section, try to find them from root level sessions
            if (sectionSessions.length === 0 && rootSessions.length > 0) {
              // Try filtering by section_id first
              sectionSessions = rootSessions.filter((s) => s.section_id && String(s.section_id) === String(sec.id));
              
              // If still no sessions found by section_id, check if we should assign all root sessions
              // This happens when:
              // 1. There's only one section (assign all root sessions to it)
              // 2. Sessions don't have section_id field (assign all to first section)
              if (sectionSessions.length === 0) {
                const hasSectionIdInRootSessions = rootSessions.some(s => s.section_id);
                if (sectionsArray.length === 1 || !hasSectionIdInRootSessions) {
                  // Assign all root sessions to this section (or first section if multiple)
                  if (secIndex === 0) {
                    sectionSessions = rootSessions;
                    console.log('Assigning all root sessions to section:', sec.id, sectionSessions.map(s => ({ id: s.id, url: s.url })));
                  }
                }
              }
            }
            
            return {
              ...sec,
              free_materials: (sec.free_materials || []).map((fm) => ({
                ...fm,
                video: joinUrl(BASE_URL, fm.video),
                files: (fm.files || []).map((f) => ({
                  ...f,
                  path: joinUrl(BASE_URL, f.path),
                })),
              })),
              sessions: sectionSessions.map((s) => ({
                ...s,
                video: s.video ? joinUrl(BASE_URL, s.video) : null,
                url: s.url || null, // External video URL (when videoType is "url")
                videoType: s.video ? 'file' : (s.url ? 'url' : null), // Determine video type
                files: ensureArray(s.files).map((f) => {
                  // Handle both object format {path, size} and string format
                  if (typeof f === 'string') {
                    return {
                      path: joinUrl(BASE_URL, f),
                      size: '',
                    };
                  }
                  return {
                    path: joinUrl(BASE_URL, f.path || ''),
                    size: f.size || '',
                  };
                }),
              })),
            };
          }),
          reviews: Array.isArray(data.reviews) ? data.reviews : [],
        });

        setReviewsSummary(
          res?.data?.reviews_summary || { total: 0, average: 0, stars: {} }
        );

        // Find first session - check sections first, then root-level sessions
        const firstSession =
          data.sections?.[0]?.sessions?.[0]?.id ??
          data.sections?.find((s) => (s.sessions || []).length > 0)
            ?.sessions?.[0]?.id ??
          data.sessions?.[0]?.id ??
          null;
        setCurrentSessionId(firstSession);
      } finally {
        setLoading(false);
      }
    })();
  }, [progId]);

  const curriculum = useMemo(() => {
    if (!course?.sections) return [];
    return course.sections.map((sec) => ({
      id: sec.id,
      title: sec.title,
      count: sec.video_count ?? (sec.sessions?.length || 0),
      duration: sec.section_duration || "0:00",
      lessons: (sec.sessions || []).map((s, idx) => ({
        id: s.id,
        index: idx + 1,
        title: s.title,
        length: s.formatted_video_duration || "0:00",
        hasResources: ensureArray(s.files).length > 0,
        files: ensureArray(s.files),
      })),
    }));
  }, [course]);

  const selectedVideoUrl = useMemo(() => {
    // Define findSession inside useMemo to avoid closure issues
    const findSession = (id) => {
      if (!id || !course?.sections) return null;
      // Convert both to strings for comparison to handle type mismatches
      const idStr = String(id);
      for (const sec of course.sections) {
        const hit = (sec.sessions || []).find((s) => String(s.id) === idStr);
        if (hit) {
          console.log('Found session:', { id: hit.id, url: hit.url, video: hit.video, sectionId: sec.id });
          return hit;
        }
      }
      console.warn('Session not found:', id, 'Available sessions:', 
        course.sections.flatMap(s => (s.sessions || []).map(sess => ({ id: sess.id, url: sess.url })))
      );
      return null;
    };

    if (!currentSessionId) {
      // No session selected, return first available video
      return (
        course?.sections?.[0]?.free_materials?.[0]?.video ||
        course?.sections?.[0]?.sessions?.[0]?.url ||
        course?.sections?.[0]?.sessions?.[0]?.video ||
        "/videos/sample.mp4"
      );
    }
    
    const selected = findSession(currentSessionId);
    if (!selected) {
      // Session not found - this shouldn't happen, but fallback to first available
      return (
        course?.sections?.[0]?.free_materials?.[0]?.video ||
        course?.sections?.[0]?.sessions?.[0]?.url ||
        course?.sections?.[0]?.sessions?.[0]?.video ||
        "/videos/sample.mp4"
      );
    }
    
    // Check for external URL first (when videoType is "url")
    // Make sure to check the actual url field, not just truthy
    if (selected.url && String(selected.url).trim()) {
      const url = String(selected.url).trim();
      console.log('Returning URL for session', currentSessionId, ':', url);
      return url;
    }
    // Then check for video file
    if (selected.video && String(selected.video).trim()) {
      const video = String(selected.video).trim();
      console.log('Returning video for session', currentSessionId, ':', video);
      return video;
    }
    // No video for this specific session - return null to show "no video" message
    console.log('No video/URL found for session', currentSessionId);
    return null;
  }, [currentSessionId, course]);

  const selectedVideoType = useMemo(() => {
    // Define findSession inside useMemo to avoid closure issues
    const findSession = (id) => {
      if (!id || !course?.sections) return null;
      const idStr = String(id);
      for (const sec of course.sections) {
        const hit = (sec.sessions || []).find((s) => String(s.id) === idStr);
        if (hit) return hit;
      }
      return null;
    };

    if (!currentSessionId) return null;
    const selected = findSession(currentSessionId);
    if (!selected) return null;
    // Check for URL first (external video)
    if (selected.url && String(selected.url).trim()) return 'url';
    // Then check for video file
    if (selected.video && String(selected.video).trim()) return 'file';
    return null;
  }, [currentSessionId, course]);

  const currentSessionFiles = useMemo(() => {
    // Define findSession inside useMemo to avoid closure issues
    const findSession = (id) => {
      if (!id || !course?.sections) return null;
      const idStr = String(id);
      for (const sec of course.sections) {
        const hit = (sec.sessions || []).find((s) => String(s.id) === idStr);
        if (hit) return hit;
      }
      return null;
    };

    const selected = currentSessionId ? findSession(currentSessionId) : null;
    return selected?.files || [];
  }, [currentSessionId, course]);

  return {
    loading,
    course,
    reviewsSummary,
    curriculum,
    selectedVideoUrl,
    selectedVideoType,
    currentSessionId,
    setCurrentSessionId,
    currentSessionFiles,
  };
}
