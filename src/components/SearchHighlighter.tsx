'use client';

import { useMemo } from 'react';

interface SearchHighlighterProps {
  text: string;
  searchQuery?: string;
  className?: string;
  highlightClassName?: string;
  caseSensitive?: boolean;
  wholeWord?: boolean;
  maxLength?: number;
  showEllipsis?: boolean;
}

interface HighlightSegment {
  text: string;
  highlighted: boolean;
  relevance?: number;
}

export default function SearchHighlighter({
  text,
  searchQuery,
  className = '',
  highlightClassName = 'bg-yellow-200 text-yellow-900 px-1 rounded font-medium',
  caseSensitive = false,
  wholeWord = false,
  maxLength,
  showEllipsis = true
}: SearchHighlighterProps) {
  
  const highlightedSegments = useMemo(() => {
    if (!searchQuery?.trim() || !text) {
      return [{ text, highlighted: false }] as HighlightSegment[];
    }

    // Clean and prepare search terms
    const searchTerms = searchQuery
      .trim()
      .split(/\s+/)
      .filter(term => term.length > 0)
      .map(term => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')); // Escape regex special chars

    if (searchTerms.length === 0) {
      return [{ text, highlighted: false }] as HighlightSegment[];
    }

    // Create regex pattern
    const flags = caseSensitive ? 'g' : 'gi';
    const wordBoundary = wholeWord ? '\\b' : '';
    const pattern = `${wordBoundary}(${searchTerms.join('|')})${wordBoundary}`;
    const regex = new RegExp(pattern, flags);

    // Split text by matches
    const segments: HighlightSegment[] = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      // Add non-highlighted text before the match
      if (match.index > lastIndex) {
        segments.push({
          text: text.slice(lastIndex, match.index),
          highlighted: false
        });
      }

      // Add highlighted match
      const matchedTerm = match[1];
      const relevance = calculateRelevance(matchedTerm, searchTerms);
      segments.push({
        text: matchedTerm,
        highlighted: true,
        relevance
      });

      lastIndex = regex.lastIndex;

      // Prevent infinite loop for zero-length matches
      if (match.index === regex.lastIndex) {
        regex.lastIndex++;
      }
    }

    // Add remaining non-highlighted text
    if (lastIndex < text.length) {
      segments.push({
        text: text.slice(lastIndex),
        highlighted: false
      });
    }

    return segments;
  }, [text, searchQuery, caseSensitive, wholeWord]);

  // Calculate relevance score for highlighting intensity
  const calculateRelevance = (matchedTerm: string, searchTerms: string[]): number => {
    const cleanTerm = matchedTerm.toLowerCase();
    
    // Exact match gets highest score
    if (searchTerms.some(term => term.toLowerCase() === cleanTerm)) {
      return 1.0;
    }
    
    // Partial match gets medium score
    if (searchTerms.some(term => term.toLowerCase().includes(cleanTerm) || cleanTerm.includes(term.toLowerCase()))) {
      return 0.7;
    }
    
    return 0.5;
  };

  // Truncate text if needed
  const processedSegments = useMemo(() => {
    if (!maxLength || text.length <= maxLength) {
      return highlightedSegments;
    }

    // Find the best segment to show (prioritize highlighted content)
    const highlightedIndices = highlightedSegments
      .map((segment, index) => ({ segment, index }))
      .filter(({ segment }) => segment.highlighted);

    if (highlightedIndices.length === 0) {
      // No highlights, just truncate from beginning
      let currentLength = 0;
      const truncated: HighlightSegment[] = [];
      
      for (const segment of highlightedSegments) {
        if (currentLength + segment.text.length <= maxLength) {
          truncated.push(segment);
          currentLength += segment.text.length;
        } else {
          const remainingLength = maxLength - currentLength;
          if (remainingLength > 0) {
            truncated.push({
              ...segment,
              text: segment.text.slice(0, remainingLength)
            });
          }
          break;
        }
      }
      
      return truncated;
    }

    // Find the first highlighted segment and try to center the truncation around it
    const firstHighlight = highlightedIndices[0];
    const firstHighlightStart = highlightedSegments
      .slice(0, firstHighlight.index)
      .reduce((acc, segment) => acc + segment.text.length, 0);

    // Calculate ideal start position (try to center the highlight)
    const idealStart = Math.max(0, firstHighlightStart - Math.floor(maxLength / 2));
    
    // Find actual start position (word boundary if possible)
    let startPos = idealStart;
    if (startPos > 0) {
      const beforeText = text.slice(0, startPos + 50); // Look ahead a bit
      const wordMatch = beforeText.match(/\s\S*$/);
      if (wordMatch) {
        startPos = beforeText.length - wordMatch[0].length + 1;
      }
    }

    // Extract the substring and re-highlight it
    const truncatedText = text.slice(startPos, startPos + maxLength);
    
    // Re-run highlighting on truncated text
    const truncatedHighlighter = new SearchHighlighter({
      text: truncatedText,
      searchQuery,
      caseSensitive,
      wholeWord
    });
    
    return truncatedHighlighter.highlightedSegments;
  }, [highlightedSegments, maxLength, text, searchQuery, caseSensitive, wholeWord]);

  const getHighlightClass = (relevance?: number): string => {
    if (!relevance) return highlightClassName;
    
    if (relevance >= 0.9) {
      return 'bg-yellow-300 text-yellow-900 px-1 rounded font-bold';
    } else if (relevance >= 0.7) {
      return 'bg-yellow-200 text-yellow-900 px-1 rounded font-medium';
    } else {
      return 'bg-yellow-100 text-yellow-800 px-1 rounded';
    }
  };

  const shouldShowEllipsis = maxLength && text.length > maxLength;

  return (
    <span className={className}>
      {processedSegments.map((segment, index) => 
        segment.highlighted ? (
          <mark 
            key={index} 
            className={getHighlightClass(segment.relevance)}
          >
            {segment.text}
          </mark>
        ) : (
          <span key={index}>{segment.text}</span>
        )
      )}
      {shouldShowEllipsis && showEllipsis && (
        <span className="text-gray-400">...</span>
      )}
    </span>
  );
}

// Utility component for highlighting multiple fields
interface MultiFieldHighlighterProps {
  fields: {
    label: string;
    text: string;
    weight?: number;
  }[];
  searchQuery?: string;
  className?: string;
  fieldClassName?: string;
  caseSensitive?: boolean;
  wholeWord?: boolean;
  maxFieldLength?: number;
}

export function MultiFieldHighlighter({
  fields,
  searchQuery,
  className = '',
  fieldClassName = 'mb-1',
  caseSensitive = false,
  wholeWord = false,
  maxFieldLength = 200
}: MultiFieldHighlighterProps) {
  
  // Calculate relevance scores for each field
  const fieldsWithRelevance = useMemo(() => {
    if (!searchQuery?.trim()) {
      return fields.map(field => ({ ...field, relevance: 0 }));
    }

    return fields.map(field => {
      const searchTerms = searchQuery.toLowerCase().split(/\s+/);
      const fieldText = field.text.toLowerCase();
      
      let relevance = 0;
      let matches = 0;
      
      searchTerms.forEach(term => {
        if (fieldText.includes(term)) {
          matches++;
          // Exact word matches get higher score
          const wordRegex = new RegExp(`\\b${term}\\b`, 'i');
          if (wordRegex.test(fieldText)) {
            relevance += 2;
          } else {
            relevance += 1;
          }
        }
      });
      
      // Normalize by number of search terms and apply field weight
      const normalizedRelevance = (relevance / searchTerms.length) * (field.weight || 1);
      
      return { ...field, relevance: normalizedRelevance, matches };
    });
  }, [fields, searchQuery]);

  // Sort fields by relevance (highest first) but keep original order for zero relevance
  const sortedFields = useMemo(() => {
    return [...fieldsWithRelevance].sort((a, b) => {
      if (a.relevance === 0 && b.relevance === 0) {
        return 0; // Keep original order
      }
      return b.relevance - a.relevance;
    });
  }, [fieldsWithRelevance]);

  return (
    <div className={className}>
      {sortedFields.map((field, index) => (
        <div key={`${field.label}-${index}`} className={fieldClassName}>
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            {field.label}:
          </span>
          <div className="mt-1">
            <SearchHighlighter
              text={field.text}
              searchQuery={searchQuery}
              caseSensitive={caseSensitive}
              wholeWord={wholeWord}
              maxLength={maxFieldLength}
              className={field.matches > 0 ? 'text-gray-900' : 'text-gray-600'}
            />
            {field.relevance > 0 && (
              <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {field.matches} match{field.matches !== 1 ? 'es' : ''}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
} 