'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  ChevronUp,
  ChevronDown,
  HelpCircle,
  MessageSquare,
  BarChart3
} from 'lucide-react';

interface FAQCategory {
  id: string;
  name: string;
  description: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
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
  created_at: string;
  updated_at: string;
  category?: FAQCategory;
}

export default function FAQManagement() {
  const [categories, setCategories] = useState<FAQCategory[]>([]);
  const [faqItems, setFaqItems] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showNewCategoryForm, setShowNewCategoryForm] = useState(false);
  const [showNewItemForm, setShowNewItemForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<FAQCategory | null>(null);
  const [editingItem, setEditingItem] = useState<FAQItem | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
    sort_order: 0
  });
  const [newItem, setNewItem] = useState({
    category_id: '',
    question: '',
    answer: '',
    sort_order: 0
  });

  const router = useRouter();
  const supabase = createClientComponentClient();
  const itemsPerPage = 10;

  useEffect(() => {
    checkAdminAccess();
    loadCategories();
    loadFaqItems();
  }, [currentPage, searchTerm, selectedCategory]);

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();

      if (!profile?.is_admin) {
        router.push('/');
        return;
      }
    } catch (error) {
      console.error('Error checking admin access:', error);
      router.push('/');
    }
  };

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('faq_categories')
        .select('*')
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
      
      let query = supabase
        .from('faq_items')
        .select(`
          *,
          category:faq_categories(*)
        `)
        .order('sort_order', { ascending: true });

      if (selectedCategory !== 'all') {
        query = query.eq('category_id', selectedCategory);
      }

      if (searchTerm) {
        query = query.or(`question.ilike.%${searchTerm}%,answer.ilike.%${searchTerm}%`);
      }

      const { data, error, count } = await query
        .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1);

      if (error) throw error;
      
      setFaqItems(data || []);
      setTotalPages(Math.ceil((count || 0) / itemsPerPage));
    } catch (error) {
      console.error('Error loading FAQ items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('faq_categories')
        .insert([{
          ...newCategory,
          sort_order: newCategory.sort_order || categories.length
        }]);

      if (error) throw error;

      setNewCategory({ name: '', description: '', sort_order: 0 });
      setShowNewCategoryForm(false);
      loadCategories();
    } catch (error) {
      console.error('Error creating category:', error);
    }
  };

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('faq_items')
        .insert([{
          ...newItem,
          sort_order: newItem.sort_order || faqItems.length
        }]);

      if (error) throw error;

      setNewItem({ category_id: '', question: '', answer: '', sort_order: 0 });
      setShowNewItemForm(false);
      loadFaqItems();
    } catch (error) {
      console.error('Error creating FAQ item:', error);
    }
  };

  const handleUpdateCategory = async (category: FAQCategory) => {
    try {
      const { error } = await supabase
        .from('faq_categories')
        .update({
          name: category.name,
          description: category.description,
          sort_order: category.sort_order
        })
        .eq('id', category.id);

      if (error) throw error;

      setEditingCategory(null);
      loadCategories();
    } catch (error) {
      console.error('Error updating category:', error);
    }
  };

  const handleUpdateItem = async (item: FAQItem) => {
    try {
      const { error } = await supabase
        .from('faq_items')
        .update({
          category_id: item.category_id,
          question: item.question,
          answer: item.answer,
          sort_order: item.sort_order
        })
        .eq('id', item.id);

      if (error) throw error;

      setEditingItem(null);
      loadFaqItems();
    } catch (error) {
      console.error('Error updating FAQ item:', error);
    }
  };

  const handleToggleActive = async (type: 'category' | 'item', id: string, currentStatus: boolean) => {
    try {
      const table = type === 'category' ? 'faq_categories' : 'faq_items';
      const { error } = await supabase
        .from(table)
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      if (type === 'category') {
        loadCategories();
      } else {
        loadFaqItems();
      }
    } catch (error) {
      console.error('Error toggling active status:', error);
    }
  };

  const handleDelete = async (type: 'category' | 'item', id: string) => {
    if (!confirm(`Are you sure you want to delete this ${type}?`)) return;

    try {
      const table = type === 'category' ? 'faq_categories' : 'faq_items';
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id);

      if (error) throw error;

      if (type === 'category') {
        loadCategories();
      } else {
        loadFaqItems();
      }
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  const handleMoveSortOrder = async (type: 'category' | 'item', id: string, direction: 'up' | 'down') => {
    try {
      const items = type === 'category' ? categories : faqItems;
      const currentIndex = items.findIndex(item => item.id === id);
      const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

      if (newIndex < 0 || newIndex >= items.length) return;

      const currentItem = items[currentIndex];
      const swapItem = items[newIndex];

      const table = type === 'category' ? 'faq_categories' : 'faq_items';
      
      await supabase
        .from(table)
        .update({ sort_order: swapItem.sort_order })
        .eq('id', currentItem.id);

      await supabase
        .from(table)
        .update({ sort_order: currentItem.sort_order })
        .eq('id', swapItem.id);

      if (type === 'category') {
        loadCategories();
      } else {
        loadFaqItems();
      }
    } catch (error) {
      console.error('Error moving sort order:', error);
    }
  };

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">FAQ Management</h1>
          <p className="text-gray-600">Manage frequently asked questions and help center content</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowNewCategoryForm(true)} className="flex items-center gap-2">
            <Plus size={16} />
            New Category
          </Button>
          <Button onClick={() => setShowNewItemForm(true)} className="flex items-center gap-2">
            <Plus size={16} />
            New FAQ Item
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total FAQ Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{faqItems.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {faqItems.reduce((sum, item) => sum + item.view_count, 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Helpful Votes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {faqItems.reduce((sum, item) => sum + item.is_helpful_votes, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search size={20} />
            Search & Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search FAQ items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="px-3 py-2 border rounded-md"
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

      {/* Categories Management */}
      <Card>
        <CardHeader>
          <CardTitle>Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {filteredCategories.map((category, index) => (
              <div key={category.id} className="flex items-center gap-4 p-3 border rounded-lg">
                <div className="flex-1">
                  {editingCategory?.id === category.id ? (
                    <div className="space-y-2">
                      <Input
                        value={editingCategory.name}
                        onChange={(e) => setEditingCategory({
                          ...editingCategory,
                          name: e.target.value
                        })}
                        placeholder="Category name"
                      />
                      <Input
                        value={editingCategory.description}
                        onChange={(e) => setEditingCategory({
                          ...editingCategory,
                          description: e.target.value
                        })}
                        placeholder="Description"
                      />
                      <div className="flex gap-2">
                        <Button onClick={() => handleUpdateCategory(editingCategory)} size="sm">
                          Save
                        </Button>
                        <Button onClick={() => setEditingCategory(null)} variant="outlined" size="sm">
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{category.name}</h3>
                        <Badge variant={category.is_active ? "default" : "secondary"}>
                          {category.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{category.description}</p>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => handleMoveSortOrder('category', category.id, 'up')}
                    disabled={index === 0}
                    variant="outlined"
                    size="sm"
                  >
                    <ChevronUp size={14} />
                  </Button>
                  <Button
                    onClick={() => handleMoveSortOrder('category', category.id, 'down')}
                    disabled={index === filteredCategories.length - 1}
                    variant="outlined"
                    size="sm"
                  >
                    <ChevronDown size={14} />
                  </Button>
                  <Button
                    onClick={() => setEditingCategory(category)}
                    variant="outlined"
                    size="sm"
                  >
                    <Edit size={14} />
                  </Button>
                  <Button
                    onClick={() => handleToggleActive('category', category.id, category.is_active)}
                    variant="outlined"
                    size="sm"
                  >
                    {category.is_active ? <EyeOff size={14} /> : <Eye size={14} />}
                  </Button>
                  <Button
                    onClick={() => handleDelete('category', category.id)}
                    variant="outlined"
                    size="sm"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* FAQ Items */}
      <Card>
        <CardHeader>
          <CardTitle>FAQ Items</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <div className="space-y-4">
              {faqItems.map((item, index) => (
                <div key={item.id} className="border rounded-lg p-4">
                  {editingItem?.id === item.id ? (
                    <div className="space-y-3">
                      <select
                        className="w-full px-3 py-2 border rounded-md"
                        value={editingItem.category_id}
                        onChange={(e) => setEditingItem({
                          ...editingItem,
                          category_id: e.target.value
                        })}
                      >
                        <option value="">Select Category</option>
                        {categories.map(category => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                      <Input
                        value={editingItem.question}
                        onChange={(e) => setEditingItem({
                          ...editingItem,
                          question: e.target.value
                        })}
                        placeholder="Question"
                      />
                      <textarea
                        className="w-full px-3 py-2 border rounded-md"
                        rows={4}
                        value={editingItem.answer}
                        onChange={(e) => setEditingItem({
                          ...editingItem,
                          answer: e.target.value
                        })}
                        placeholder="Answer"
                      />
                      <div className="flex gap-2">
                        <Button onClick={() => handleUpdateItem(editingItem)} size="sm">
                          Save
                        </Button>
                        <Button onClick={() => setEditingItem(null)} variant="outlined" size="sm">
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-medium">{item.question}</h3>
                            <Badge variant={item.is_active ? "default" : "secondary"}>
                              {item.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                            <Badge variant="outline">
                              {item.category?.name || 'No Category'}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{item.answer}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Eye size={12} />
                              {item.view_count} views
                            </span>
                            <span className="flex items-center gap-1">
                              <BarChart3 size={12} />
                              {item.is_helpful_votes} helpful
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageSquare size={12} />
                              {item.is_not_helpful_votes} not helpful
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() => handleMoveSortOrder('item', item.id, 'up')}
                            disabled={index === 0}
                            variant="outlined"
                            size="sm"
                          >
                            <ChevronUp size={14} />
                          </Button>
                          <Button
                            onClick={() => handleMoveSortOrder('item', item.id, 'down')}
                            disabled={index === faqItems.length - 1}
                            variant="outlined"
                            size="sm"
                          >
                            <ChevronDown size={14} />
                          </Button>
                          <Button
                            onClick={() => setEditingItem(item)}
                            variant="outlined"
                            size="sm"
                          >
                            <Edit size={14} />
                          </Button>
                          <Button
                            onClick={() => handleToggleActive('item', item.id, item.is_active)}
                            variant="outlined"
                            size="sm"
                          >
                            {item.is_active ? <EyeOff size={14} /> : <Eye size={14} />}
                          </Button>
                          <Button
                            onClick={() => handleDelete('item', item.id)}
                            variant="outlined"
                            size="sm"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            variant="outlined"
          >
            Previous
          </Button>
          <span className="flex items-center px-4">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            variant="outlined"
          >
            Next
          </Button>
        </div>
      )}

      {/* New Category Form Modal */}
      {showNewCategoryForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">New Category</h2>
            <form onSubmit={handleCreateCategory} className="space-y-4">
              <Input
                placeholder="Category name"
                value={newCategory.name}
                onChange={(e) => setNewCategory({
                  ...newCategory,
                  name: e.target.value
                })}
                required
              />
              <Input
                placeholder="Description"
                value={newCategory.description}
                onChange={(e) => setNewCategory({
                  ...newCategory,
                  description: e.target.value
                })}
              />
              <Input
                type="number"
                placeholder="Sort order"
                value={newCategory.sort_order}
                onChange={(e) => setNewCategory({
                  ...newCategory,
                  sort_order: parseInt(e.target.value) || 0
                })}
              />
              <div className="flex gap-2">
                <Button type="submit">Create Category</Button>
                <Button type="button" variant="outlined" onClick={() => setShowNewCategoryForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New FAQ Item Form Modal */}
      {showNewItemForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">New FAQ Item</h2>
            <form onSubmit={handleCreateItem} className="space-y-4">
              <select
                className="w-full px-3 py-2 border rounded-md"
                value={newItem.category_id}
                onChange={(e) => setNewItem({
                  ...newItem,
                  category_id: e.target.value
                })}
                required
              >
                <option value="">Select Category</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <Input
                placeholder="Question"
                value={newItem.question}
                onChange={(e) => setNewItem({
                  ...newItem,
                  question: e.target.value
                })}
                required
              />
              <textarea
                className="w-full px-3 py-2 border rounded-md"
                rows={4}
                placeholder="Answer"
                value={newItem.answer}
                onChange={(e) => setNewItem({
                  ...newItem,
                  answer: e.target.value
                })}
                required
              />
              <Input
                type="number"
                placeholder="Sort order"
                value={newItem.sort_order}
                onChange={(e) => setNewItem({
                  ...newItem,
                  sort_order: parseInt(e.target.value) || 0
                })}
              />
              <div className="flex gap-2">
                <Button type="submit">Create FAQ Item</Button>
                <Button type="button" variant="outlined" onClick={() => setShowNewItemForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
