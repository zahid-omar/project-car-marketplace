'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { 
  Search, 
  ChevronDown, 
  ChevronRight, 
  HelpCircle, 
  ThumbsUp, 
  ThumbsDown,
  MessageSquare,
  Mail
} from 'lucide-react';

interface FAQCategory {
  id: string;
  name: string;
  description: string;
  sort_order: number;
  is_active: boolean;
}

interface FAQItem {
  id: string;
  category_id: string;
  question: string;
  answer: string;
  sort_order: number;
  is_active: boolean;
  view_count: number;
  is_helpful_votes: number;
  is_not_helpful_votes: number;
  category?: FAQCategory;
}

export default function FAQPage() {
  const [categories, setCategories] = useState<FAQCategory[]>([]);
  const [faqItems, setFaqItems] = useState<FAQItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [votedItems, setVotedItems] = useState<Set<string>>(new Set());

  const supabase = createClientComponentClient();

  useEffect(() => {
    loadCategories();
    loadFaqItems();
  }, []);

  useEffect(() => {
    filterItems();
  }, [faqItems, searchTerm, selectedCategory]);

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('faq_categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadFaqItems = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('faq_items')
        .select(`
          *,
          category:faq_categories(*)
        `)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      
      setFaqItems(data || []);
    } catch (error) {
      console.error('Error loading FAQ items:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterItems = () => {
    let filtered = faqItems;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category_id === selectedCategory);
    }

    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.answer.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredItems(filtered);
  };

  const toggleExpanded = async (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (expandedItems.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
      // Increment view count
      await supabase
        .from('faq_items')
        .update({ view_count: supabase.rpc('increment_view_count', { item_id: itemId }) })
        .eq('id', itemId);
    }
    setExpandedItems(newExpanded);
  };

  const handleVote = async (itemId: string, helpful: boolean) => {
    if (votedItems.has(itemId)) return;

    try {
      const field = helpful ? 'is_helpful_votes' : 'is_not_helpful_votes';
      const { error } = await supabase
        .from('faq_items')
        .update({ [field]: supabase.rpc('increment_vote', { item_id: itemId, vote_type: field }) })
        .eq('id', itemId);

      if (error) throw error;

      setVotedItems(prev => new Set(prev).add(itemId));
      
      // Update local state
      setFaqItems(prev => prev.map(item => 
        item.id === itemId
          ? { ...item, [field]: item[field] + 1 }
          : item
      ));
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  const groupedItems = categories.reduce((acc, category) => {
    acc[category.id] = filteredItems.filter(item => item.category_id === category.id);
    return acc;
  }, {} as Record<string, FAQItem[]>);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading FAQ...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <HelpCircle size={32} className="text-blue-600" />
        </div>
        <h1 className="text-3xl font-bold mb-2">Frequently Asked Questions</h1>
        <p className="text-gray-600">
          Find answers to common questions about Project Car Marketplace
        </p>
      </div>

      {/* Search and Filter */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search frequently asked questions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <select
              className="px-4 py-2 border rounded-lg bg-white"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* FAQ Items */}
      {selectedCategory === 'all' ? (
        // Show grouped by category
        <div className="space-y-8">
          {categories.map(category => {
            const items = groupedItems[category.id] || [];
            if (items.length === 0) return null;

            return (
              <div key={category.id}>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  {category.name}
                  <span className="text-sm text-gray-500">({items.length})</span>
                </h2>
                <div className="space-y-2">
                  {items.map(item => (
                    <Card key={item.id} className="transition-all hover:shadow-md">
                      <CardHeader 
                        className="pb-3 cursor-pointer"
                        onClick={() => toggleExpanded(item.id)}
                      >
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg font-medium">
                            {item.question}
                          </CardTitle>
                          {expandedItems.has(item.id) ? (
                            <ChevronDown className="h-5 w-5 text-gray-500" />
                          ) : (
                            <ChevronRight className="h-5 w-5 text-gray-500" />
                          )}
                        </div>
                      </CardHeader>
                      
                      {expandedItems.has(item.id) && (
                        <CardContent>
                          <div className="prose max-w-none">
                            <p className="text-gray-700 mb-4">{item.answer}</p>
                          </div>
                          
                          <div className="flex items-center justify-between pt-4 border-t">
                            <div className="flex items-center gap-4">
                              <span className="text-sm text-gray-500">
                                Was this helpful?
                              </span>
                              <div className="flex items-center gap-2">
                                <Button
                                  onClick={() => handleVote(item.id, true)}
                                  variant="outlined"
                                  size="sm"
                                  disabled={votedItems.has(item.id)}
                                  className="flex items-center gap-1"
                                >
                                  <ThumbsUp size={14} />
                                  {item.is_helpful_votes}
                                </Button>
                                <Button
                                  onClick={() => handleVote(item.id, false)}
                                  variant="outlined"
                                  size="sm"
                                  disabled={votedItems.has(item.id)}
                                  className="flex items-center gap-1"
                                >
                                  <ThumbsDown size={14} />
                                  {item.is_not_helpful_votes}
                                </Button>
                              </div>
                            </div>
                            
                            <div className="text-sm text-gray-500">
                              {item.view_count} views
                            </div>
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        // Show filtered items
        <div className="space-y-2">
          {filteredItems.map(item => (
            <Card key={item.id} className="transition-all hover:shadow-md">
              <CardHeader 
                className="pb-3 cursor-pointer"
                onClick={() => toggleExpanded(item.id)}
              >
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-medium">
                    {item.question}
                  </CardTitle>
                  {expandedItems.has(item.id) ? (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-gray-500" />
                  )}
                </div>
              </CardHeader>
              
              {expandedItems.has(item.id) && (
                <CardContent>
                  <div className="prose max-w-none">
                    <p className="text-gray-700 mb-4">{item.answer}</p>
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-500">
                        Was this helpful?
                      </span>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => handleVote(item.id, true)}
                          variant="outlined"
                          size="sm"
                          disabled={votedItems.has(item.id)}
                          className="flex items-center gap-1"
                        >
                          <ThumbsUp size={14} />
                          {item.is_helpful_votes}
                        </Button>
                        <Button
                          onClick={() => handleVote(item.id, false)}
                          variant="outlined"
                          size="sm"
                          disabled={votedItems.has(item.id)}
                          className="flex items-center gap-1"
                        >
                          <ThumbsDown size={14} />
                          {item.is_not_helpful_votes}
                        </Button>
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-500">
                      {item.view_count} views
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {filteredItems.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <HelpCircle size={48} className="mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium mb-2">No results found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm
                ? `No FAQ items match "${searchTerm}"`
                : 'No FAQ items in this category'
              }
            </p>
            <Button onClick={() => { setSearchTerm(''); setSelectedCategory('all'); }}>
              Clear filters
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Contact Support */}
      <Card className="mt-8">
        <CardContent className="text-center py-8">
          <h3 className="text-lg font-medium mb-2">Still need help?</h3>
          <p className="text-gray-600 mb-4">
            Can't find the answer you're looking for? Contact our support team.
          </p>
          <div className="flex justify-center gap-4">
            <Button className="flex items-center gap-2">
              <MessageSquare size={16} />
              Live Chat
            </Button>
            <Button variant="outlined" className="flex items-center gap-2">
              <Mail size={16} />
              Email Support
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
