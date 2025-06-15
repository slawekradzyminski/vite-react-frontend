import { describe, it, expect } from 'vitest';
import { splitThinking } from './parseThinking';

describe('splitThinking', () => {
  it('should extract single thinking block', () => {
    // given
    const input = 'Before <think>This is my reasoning</think> After';
    
    // when
    const result = splitThinking(input);
    
    // then
    expect(result.cleaned).toBe('Before  After');
    expect(result.thinking).toBe('This is my reasoning');
  });

  it('should extract multiple thinking blocks', () => {
    // given
    const input = 'Start <think>First thought</think> Middle <think>Second thought</think> End';
    
    // when
    const result = splitThinking(input);
    
    // then
    expect(result.cleaned).toBe('Start  Middle  End');
    expect(result.thinking).toBe('First thought\n\nSecond thought');
  });

  it('should handle nested content within thinking blocks', () => {
    // given
    const input = 'Text <think>I need to think about this:\n- Point 1\n- Point 2</think> More text';
    
    // when
    const result = splitThinking(input);
    
    // then
    expect(result.cleaned).toBe('Text  More text');
    expect(result.thinking).toBe('I need to think about this:\n- Point 1\n- Point 2');
  });

  it('should handle malformed tags gracefully', () => {
    // given
    const input = 'Text <think>Unclosed thinking block More text';
    
    // when
    const result = splitThinking(input);
    
    // then
    expect(result.cleaned).toBe('Text <think>Unclosed thinking block More text');
    expect(result.thinking).toBe('');
  });

  it('should handle empty thinking blocks', () => {
    // given
    const input = 'Text <think></think> More text';
    
    // when
    const result = splitThinking(input);
    
    // then
    expect(result.cleaned).toBe('Text  More text');
    expect(result.thinking).toBe('');
  });

  it('should handle text with no thinking blocks', () => {
    // given
    const input = 'Just regular text without any thinking blocks';
    
    // when
    const result = splitThinking(input);
    
    // then
    expect(result.cleaned).toBe('Just regular text without any thinking blocks');
    expect(result.thinking).toBe('');
  });

  it('should handle case insensitive tags', () => {
    // given
    const input = 'Text <THINK>Upper case</THINK> and <Think>Mixed case</Think> tags';
    
    // when
    const result = splitThinking(input);
    
    // then
    expect(result.cleaned).toBe('Text  and  tags');
    expect(result.thinking).toBe('Upper case\n\nMixed case');
  });

  it('should trim whitespace from cleaned content', () => {
    // given
    const input = '  <think>Remove me</think>  ';
    
    // when
    const result = splitThinking(input);
    
    // then
    expect(result.cleaned).toBe('');
    expect(result.thinking).toBe('Remove me');
  });

  it('should handle multiline thinking blocks', () => {
    // given
    const input = `Text <think>
      This is a multiline
      thinking block
      with multiple lines
    </think> More text`;
    
    // when
    const result = splitThinking(input);
    
    // then
    expect(result.cleaned).toBe('Text  More text');
    expect(result.thinking).toBe('This is a multiline\n      thinking block\n      with multiple lines');
  });
});