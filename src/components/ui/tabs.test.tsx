import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './tabs';

describe('Tabs', () => {
  // given
  it('renders tabs with content', () => {
    // when
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Tab 1 content</TabsContent>
        <TabsContent value="tab2">Tab 2 content</TabsContent>
      </Tabs>
    );
    
    // then
    const tabsList = screen.getByTestId('tabs-list');
    expect(tabsList).toBeInTheDocument();
    
    const tabTriggers = screen.getAllByTestId('tabs-trigger');
    expect(tabTriggers).toHaveLength(2);
    expect(tabTriggers[0]).toHaveTextContent('Tab 1');
    expect(tabTriggers[1]).toHaveTextContent('Tab 2');
    
    // Check tab trigger active states
    expect(tabTriggers[0]).toHaveAttribute('data-state', 'active');
    expect(tabTriggers[1]).toHaveAttribute('data-state', 'inactive');
    
    // First tab content should be active by default
    const tabContents = screen.getAllByTestId('tabs-content');
    expect(tabContents[0]).toHaveAttribute('data-state', 'active');
    expect(tabContents[1]).toHaveAttribute('data-state', 'inactive');
  });

  // given
  it('renders tab with specific value as active', () => {
    // when
    render(
      <Tabs defaultValue="tab2">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Tab 1 content</TabsContent>
        <TabsContent value="tab2">Tab 2 content</TabsContent>
      </Tabs>
    );
    
    const tabTriggers = screen.getAllByTestId('tabs-trigger');
    const tabContents = screen.getAllByTestId('tabs-content');
    
    // Second tab should be active 
    expect(tabTriggers[0]).toHaveAttribute('data-state', 'inactive');
    expect(tabTriggers[1]).toHaveAttribute('data-state', 'active');
    expect(tabContents[0]).toHaveAttribute('data-state', 'inactive');
    expect(tabContents[1]).toHaveAttribute('data-state', 'active');
  });

  // given
  it('renders tabs with custom class names', () => {
    // when
    render(
      <Tabs defaultValue="tab1">
        <TabsList className="custom-tabs-list">
          <TabsTrigger className="custom-trigger" value="tab1">Tab 1</TabsTrigger>
        </TabsList>
        <TabsContent className="custom-content" value="tab1">Content</TabsContent>
      </Tabs>
    );
    
    // then
    expect(screen.getByTestId('tabs-list')).toHaveClass('custom-tabs-list');
    expect(screen.getByTestId('tabs-trigger')).toHaveClass('custom-trigger');
    expect(screen.getByTestId('tabs-content')).toHaveClass('custom-content');
  });

  // given
  it('renders tabs with custom data-testid', () => {
    // when
    render(
      <Tabs defaultValue="tab1">
        <TabsList data-testid="custom-tabs-list">
          <TabsTrigger data-testid="custom-trigger" value="tab1">Tab 1</TabsTrigger>
        </TabsList>
        <TabsContent data-testid="custom-content" value="tab1">Content</TabsContent>
      </Tabs>
    );
    
    // then
    expect(screen.getByTestId('custom-tabs-list')).toBeInTheDocument();
    expect(screen.getByTestId('custom-trigger')).toBeInTheDocument();
    expect(screen.getByTestId('custom-content')).toBeInTheDocument();
  });
}); 